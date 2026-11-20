import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { config, workbookBytes, fixtureSheets, mode, users } from './helpers.js';
import { parseWorkbook } from '../../services/exams/workbook.js';
import { studentSchedule, qualityReport, planRecipients, validEmail } from '../../services/exams/schedule.js';
import { reminderMail, missingRoomText } from '../../services/exams/mail.js';

const model = async (sheets) => parseWorkbook(await workbookBytes(sheets), config());
describe('student schedules and data-quality reporting', () => {
    it('combines several slots, orders them and uses membership in multi-course rooms', async () => {
        const m = await model(); const schedule = studentSchedule('2601CS01', '2026-11-21', m, config());
        expect(schedule.map((e) => e.slotId)).toEqual(['morning', 'evening']);
        expect(schedule.map((e) => e.rooms)).toEqual([['102'], ['LT001']]);
        const planned = planRecipients(users, '2026-11-21', m, config(), mode);
        expect(planned.recipients).toHaveLength(3);
        expect(planned.recipients[0].exams).toHaveLength(2);
    });
    it('has no exams on holiday, unrelated dates and for unenrolled students', async () => {
        const m = await model();
        for (const date of ['2026-11-24', '2026-12-01']) expect(studentSchedule('2601CS01', date, m, config())).toEqual([]);
        expect(studentSchedule('2601CS05', '2026-11-21', m, config())).toEqual([]);
    });
    it('keeps missing-room exams and reports unused enrolments and seated extra rolls', async () => {
        const m = await model();
        expect(studentSchedule('2601CS03', '2026-11-21', m, config())[0].missingRoom).toBe(true);
        const r = qualityReport(m, config());
        expect(r.unusedEnrolment).toEqual(['EE400']);
        expect(r.seatedNotEnrolled).toHaveLength(1);
        expect(r.missingRooms).toHaveLength(1);
    });
    it('retains clashes and ambiguous rooms without arbitrary first-room choices', async () => {
        const sheets = fixtureSheets(); sheets['EndSem Timetable'][1][1] += ',DD300';
        sheets['Course Wise List'][3][1] = '2601CS01;2601CS04';
        sheets['Room Allocation EndSem'].push(['2026-11-21', 'Morning', 'Hall B', 'AA100/BB100 (1)', '2601CS01']);
        const m = await model(sheets);
        const exams = studentSchedule('2601CS01', '2026-11-21', m, config());
        expect(exams.filter((e) => e.clash)).toHaveLength(2);
        expect(exams.find((e) => e.unit === 'AA100/BB100').ambiguousRoom).toBe(true);
        expect(qualityReport(m, config()).clashes).toHaveLength(1);
    });
    it('narrows conflicting room candidates by unit but accepts sole date-slot-roll matches', async () => {
        const sheets = fixtureSheets();
        sheets['Room Allocation EndSem'].push(['2026-11-21', 'Morning', 'Wrong hall', 'CC200 (1)', '2601CS01']);
        const m = await model(sheets);
        expect(studentSchedule('2601CS01', '2026-11-21', m, config())[0].rooms).toEqual(['102']);
        m.rooms[0].unit = 'ZZ999';
        expect(studentSchedule('2601CS02', '2026-11-21', m, config())[0].rooms).toEqual(['102']);
    });
    it('reports timetable units without enrolment', async () => {
        const sheets = fixtureSheets(); sheets['EndSem Timetable'][1][1] += ',ZZ999';
        expect(qualityReport(await model(sheets), config()).missingEnrolment).toEqual(['ZZ999']);
    });
    it('filters DB users, selects valid emails for duplicate rolls and applies allowlists', async () => {
        const m = await model();
        const list = [users[0], { id: 9, rollNo: '2601CS01', email: 'duplicate@example.org' }, { id: 10, rollNo: '2601CS03', email: 'bad' }, { id: 11, rollNo: '', email: 'x@example.org' }];
        const p = planRecipients(list, '2026-11-21', m, config(), mode);
        expect(p.recipients.map((r) => r.email)).toEqual(['one@example.org']);
        expect(p.summary).toMatchObject({ noEmail: 1, invalidRoll: 1, duplicateRoll: 1, notRegistered: 1 });
        expect(planRecipients(users, '2026-11-21', m, config(), { ...mode, test: true, rolls: ['2601cs02'] }).recipients.map((r) => r.roll)).toEqual(['2601CS02']);
        expect(planRecipients(users, '2026-11-21', m, config(), { ...mode, test: true, emails: ['three@example.org'] }).recipients.map((r) => r.roll)).toEqual(['2601CS03']);
    });
    it('sorts a renamed three-slot dataset with no business-logic changes', async () => {
        const fixture = JSON.parse(await readFile(new URL('./fixtures/alternate.json', import.meta.url)));
        const c = config(fixture.config); const m = await parseWorkbook(await workbookBytes(fixture.sheets), c);
        expect(studentSchedule('ST001', '2026-12-05', m, c).map((e) => e.slotId)).toEqual(['early', 'noon', 'late']);
    });
});

describe('recipient-only email content', () => {
    it('rejects recipient lists, display names and header newlines as DB mailboxes', () => {
        for (const address of ['one,two@example.org', 'Name <one@example.org>', 'one@example.org\n', 'one;two@example.org']) expect(validEmail(address)).toBe(false);
        expect(validEmail(' one+tag@example.org ')).toBe(true);
    });
    it('builds HTML and text with missing-room, clash and ambiguous-room warnings', async () => {
        const m = await model(); const c = config();
        c.examName = 'Exam <script>alert(1)</script>';
        const exams = studentSchedule('2601CS03', '2026-11-21', m, c);
        exams[0].clash = true;
        const message = reminderMail({ roll: '2601CS03', exams }, '2026-11-21', c);
        expect(message.text).toContain(missingRoomText);
        expect(message.html).toContain('CLASH WARNING');
        expect(message.html).toContain('&lt;script&gt;');
        expect(message.html).not.toContain('<script>');
        expect(message.text).not.toContain('2601CS01');
        expect(message.subject).toContain('Saturday, 21 Nov 2026');
        expect(message.text).toContain('ID card');
    });
});
