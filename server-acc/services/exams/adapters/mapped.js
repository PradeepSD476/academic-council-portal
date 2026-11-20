import { headerKey, splitCell, normaliseUnit, normaliseRoom, normaliseRoll, validRoll, parseDate } from '../normalise.js';

function cellValue(cell) {
    const value = cell.value;
    if (value && typeof value === 'object' && !(value instanceof Date)) {
        if ('formula' in value || 'sharedFormula' in value) return value.result ?? '';
        if (value.richText) return value.richText.map((r) => r.text).join('');
        if (value.text !== undefined) return value.text;
        if (value.error) throw new Error(`Spreadsheet error ${value.error} at ${cell.address}`);
    }
    return value ?? '';
}

function findTable(workbook, role, extraColumns = {}) {
    const sheet = workbook.getWorksheet(role.tab);
    if (!sheet) throw new Error(`tab '${role.tab}' not found`);
    const mappings = { ...role.columns, ...extraColumns };
    let found;
    let bestMissing = Object.keys(mappings);
    sheet.eachRow((row) => {
        if (found) return;
        const columns = {};
        for (const [field, mapping] of Object.entries(mappings)) {
            if (typeof mapping === 'object' && !Array.isArray(mapping)) {
                if (String(cellValue(row.getCell(mapping.position))).trim()) columns[field] = mapping.position;
                continue;
            }
            const aliases = (Array.isArray(mapping) ? mapping : [mapping]).map(headerKey);
            const matches = [];
            row.eachCell((cell, col) => { if (aliases.includes(headerKey(cellValue(cell)))) matches.push(col); });
            if (matches.length === 1) columns[field] = matches[0];
            if (matches.length > 1) throw new Error(`Ambiguous column '${field}' in '${role.tab}' (row ${row.number})`);
        }
        const missing = Object.keys(mappings).filter((k) => !columns[k]);
        if (missing.length < bestMissing.length) bestMissing = missing;
        if (!missing.length) found = { headerRow: row.number, columns };
    });
    if (!found) {
        const field = bestMissing[0];
        const mapping = mappings[field];
        const label = typeof mapping === 'string' ? mapping : Array.isArray(mapping) ? mapping.join(' / ') : `position ${mapping.position}`;
        throw new Error(`column '${label}' missing in '${role.tab}'`);
    }
    const rows = [];
    sheet.eachRow((row) => {
        if (row.number <= found.headerRow) return;
        const values = Object.fromEntries(Object.entries(found.columns).map(([field, col]) => [field, cellValue(row.getCell(col))]));
        if (Object.values(values).every((v) => String(v).trim() === '')) return;
        rows.push({ ...values, context: `in '${role.tab}', row ${row.number}` });
    });
    return rows;
}

function slotId(value, config, context) {
    const slot = config.slots.find((s) => [s.id, s.label, ...s.aliases].some((a) => headerKey(a) === headerKey(value)));
    if (!slot) throw new Error(`Unknown slot '${value}' ${context}`);
    return slot.id;
}

function rollSet(value, separators, config, context) {
    const result = new Set();
    for (const raw of splitCell(value, separators)) {
        const roll = normaliseRoll(raw, config);
        if (!validRoll(roll, config)) throw new Error(`Invalid roll '${raw}' ${context}`);
        result.add(roll);
    }
    return result;
}

export function parseMappedWorkbook(workbook, config) {
    const timetable = [];
    const rooms = [];
    const enrolments = new Map();
    const holidays = new Set(config.holidays.dates);
    const labels = new Map();
    const extra = config.timetable.layout === 'grid' ? Object.fromEntries(config.slots.map((s) => [`slot:${s.id}`, s.header])) : {};
    const rows = findTable(workbook, config.timetable, extra);
    for (const row of rows) {
        const date = parseDate(row.date, config, row.context);
        const cells = config.timetable.layout === 'grid'
            ? config.slots.map((s) => ({ slot: s.id, value: row[`slot:${s.id}`] }))
            : [{ slot: null, value: row.unit }];
        const tokens = cells.flatMap(({ slot, value }) => splitCell(value, config.separators.courses).map((label) => ({ slot, label, unit: normaliseUnit(label, config) })));
        if (!tokens.length) continue;
        const hasHoliday = tokens.some((t) => config.holidays.keywords.some((k) => headerKey(t.label).includes(headerKey(k))));
        if (hasHoliday && tokens.some((t) => t.unit)) throw new Error(`Holiday and exam courses mixed on ${date} ${row.context}`);
        if (hasHoliday || tokens.every((t) => !t.unit)) { holidays.add(date); continue; }
        for (const token of tokens) {
            if (!token.unit) throw new Error(`Invalid course '${token.label}' ${row.context}`);
            const slot = token.slot || slotId(row.slot, config, row.context);
            timetable.push({ date, slotId: slot, unit: token.unit });
            labels.set(token.unit, token.label.trim());
        }
    }
    const uniqueTimetable = [...new Map(timetable.map((t) => [`${t.date}|${t.slotId}|${t.unit}`, t])).values()].filter((t) => !holidays.has(t.date));
    if (!uniqueTimetable.length) throw new Error(`No exam dates found in '${config.timetable.tab}'`);
    for (const row of findTable(workbook, config.enrolments)) {
        const unit = normaliseUnit(row.unit, config);
        if (!unit) throw new Error(`Invalid course '${row.unit}' ${row.context}`);
        if (!enrolments.has(unit)) enrolments.set(unit, new Set());
        for (const roll of rollSet(row.rolls, config.separators.enrolmentRolls, config, row.context)) enrolments.get(unit).add(roll);
    }
    if (!enrolments.size || ![...enrolments.values()].some((r) => r.size)) throw new Error(`No enrolment rolls found in '${config.enrolments.tab}'`);
    for (const row of findTable(workbook, config.rooms)) {
        const date = parseDate(row.date, config, row.context);
        const slot = slotId(row.slot, config, row.context);
        const room = normaliseRoom(row.room);
        if (!room) throw new Error(`Room missing ${row.context}`);
        const rolls = rollSet(row.rolls, config.separators.roomRolls, config, row.context);
        const units = splitCell(row.unit, config.separators.roomCourses).map((s) => s.replace(/\s*\(\d+\)\s*$/, ''));
        if (!units.length) throw new Error(`Courses missing ${row.context}`);
        for (const raw of units) {
            const unit = normaliseUnit(raw, config);
            if (!unit) throw new Error(`Invalid course '${raw}' ${row.context}`);
            rooms.push({ date, slotId: slot, room, unit, rolls: new Set(rolls) });
        }
    }
    return { timetable: uniqueTimetable, rooms, enrolments, holidays, labels };
}
