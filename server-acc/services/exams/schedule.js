import { normaliseRoll, validRoll } from './normalise.js';

export function buildIndex(model) {
    const examsByRoll = new Map();
    const roomIndex = new Map();
    for (const exam of model.timetable) for (const roll of model.enrolments.get(exam.unit) || []) {
        if (!examsByRoll.has(roll)) examsByRoll.set(roll, []);
        examsByRoll.get(roll).push(exam);
    }
    for (const seating of model.rooms) for (const roll of seating.rolls) {
        const key = `${seating.date}|${seating.slotId}|${roll}`;
        if (!roomIndex.has(key)) roomIndex.set(key, []);
        roomIndex.get(key).push(seating);
    }
    return { examsByRoll, roomIndex };
}

export function studentSchedule(roll, date, model, config, index = buildIndex(model)) {
    if (model.holidays.has(date)) return [];
    const exams = (index.examsByRoll.get(roll) || []).filter((e) => e.date === date);
    const slotCounts = new Map();
    for (const e of exams) slotCounts.set(e.slotId, (slotCounts.get(e.slotId) || 0) + 1);
    return exams.map((exam) => {
        let matches = index.roomIndex.get(`${date}|${exam.slotId}|${roll}`) || [];
        const allRooms = [...new Set(matches.map((r) => r.room))];
        if (allRooms.length > 1 && matches.some((r) => r.unit === exam.unit)) matches = matches.filter((r) => r.unit === exam.unit);
        const rooms = [...new Set(matches.map((r) => r.room))].sort();
        const slot = config.slots.find((s) => s.id === exam.slotId);
        return { ...exam, course: model.labels.get(exam.unit) || exam.unit, slot: slot.label, time: slot.displayTime, rooms, missingRoom: rooms.length === 0, ambiguousRoom: rooms.length > 1, clash: slotCounts.get(exam.slotId) > 1 };
    }).sort((a, b) => config.slots.findIndex((s) => s.id === a.slotId) - config.slots.findIndex((s) => s.id === b.slotId) || a.unit.localeCompare(b.unit));
}

export function qualityReport(model, config, index = buildIndex(model)) {
    const timetableUnits = new Set(model.timetable.map((e) => e.unit));
    const report = { missingEnrolment: [...timetableUnits].filter((u) => !model.enrolments.has(u)), unusedEnrolment: [...model.enrolments.keys()].filter((u) => !timetableUnits.has(u)), missingRooms: [], ambiguousRooms: [], clashes: [], seatedNotEnrolled: [] };
    const dates = [...new Set(model.timetable.map((e) => e.date))].sort();
    for (const [roll, exams] of index.examsByRoll) for (const date of new Set(exams.map((e) => e.date))) {
        const schedule = studentSchedule(roll, date, model, config, index);
        for (const exam of schedule) {
            const detail = { roll, date, slotId: exam.slotId, unit: exam.unit };
            if (exam.missingRoom) report.missingRooms.push(detail);
            if (exam.ambiguousRoom) report.ambiguousRooms.push({ ...detail, rooms: exam.rooms });
        }
        for (const slotId of new Set(schedule.filter((e) => e.clash).map((e) => e.slotId))) report.clashes.push({ roll, date, slotId, units: schedule.filter((e) => e.slotId === slotId).map((e) => e.unit) });
    }
    // A multi-course room's complete roll list is shared by its normalised unit entries.
    const grouped = new Map();
    for (const r of model.rooms) {
        const key = `${r.date}|${r.slotId}|${r.room}`;
        if (!grouped.has(key)) grouped.set(key, { date: r.date, slotId: r.slotId, room: r.room, units: new Set(), rolls: new Set() });
        const g = grouped.get(key); g.units.add(r.unit); for (const roll of r.rolls) g.rolls.add(roll);
    }
    for (const g of grouped.values()) for (const roll of g.rolls) if (![...g.units].some((u) => model.enrolments.get(u)?.has(roll))) report.seatedNotEnrolled.push({ date: g.date, slotId: g.slotId, room: g.room, roll });
    return { ...report, dates, holidays: [...model.holidays].sort(), units: timetableUnits.size, enrolmentUnits: model.enrolments.size, enrolledRolls: new Set([...model.enrolments.values()].flatMap((s) => [...s])).size };
}

// One mailbox only, not a display-name/list string that Nodemailer might expand into recipients.
export const validEmail = (email) => typeof email === 'string' && /^[^\s@<>,;:"()[\]\\]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/.test(email.trim()) && !/[\r\n]/.test(email);

export function planRecipients(users, date, model, config, mode, index = buildIndex(model)) {
    const summary = { noEmail: 0, invalidRoll: 0, duplicateRoll: 0, noExam: 0, allowlistExcluded: 0, notRegistered: 0 };
    const byRoll = new Map();
    const invalidUsers = []; const duplicates = [];
    for (const user of [...users].sort((a, b) => a.id - b.id)) {
        const roll = normaliseRoll(user.rollNo, config);
        if (!validRoll(roll, config)) { summary.invalidRoll++; invalidUsers.push({ id: user.id, reason: 'invalid or missing roll' }); continue; }
        if (!byRoll.has(roll)) byRoll.set(roll, []);
        byRoll.get(roll).push(user);
    }
    const recipients = [];
    for (const [roll, candidates] of byRoll) {
        summary.noEmail += candidates.filter((u) => !validEmail(u.email)).length;
        if (candidates.length > 1) { summary.duplicateRoll += candidates.length - 1; duplicates.push({ roll, userIds: candidates.map((u) => u.id) }); }
        const user = candidates.find((u) => validEmail(u.email));
        const exams = studentSchedule(roll, date, model, config, index);
        if (!exams.length) { summary.noExam++; continue; }
        if (!user) continue;
        if (mode.test && !mode.rolls.map((r) => normaliseRoll(r, config)).includes(roll) && !mode.emails.includes(user.email.trim().toLowerCase())) { summary.allowlistExcluded++; continue; }
        recipients.push({ userId: user.id, roll, email: user.email.trim(), exams });
    }
    for (const [roll, exams] of index.examsByRoll) if (!byRoll.has(roll) && exams.some((e) => e.date === date)) summary.notRegistered++;
    return { recipients, summary, invalidUsers, duplicates };
}
