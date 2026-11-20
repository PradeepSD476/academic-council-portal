import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { config, workbookBytes, fixtureSheets } from './helpers.js';
import { parseWorkbook, adapters } from '../../services/exams/workbook.js';
import { normaliseRoom, normaliseRoll, normaliseUnit, parseDate } from '../../services/exams/normalise.js';
import { validateRegistry, loadRegistry } from '../../services/exams/config.js';

describe('exam normalisation and mapped workbook adapter', () => {
    it('uses the default registry for a blank config-path environment setting', async () => {
        expect((await loadRegistry('', {})).datasets[0].id).toBe('endsem-autumn-2026');
    });
    it('keeps custom adapter options/layouts isolated from the mapped-adapter rules', async () => {
        const c = config({ adapter: 'test-custom', adapterOptions: { headerBands: 3 }, timetable: { tab: 'Custom', layout: 'bands', columns: {} }, rooms: { tab: 'Seating', columns: {} }, enrolments: { tab: 'Pupils', columns: {} } });
        adapters.set('test-custom', (_workbook, options) => ({ custom: options.adapterOptions.headerBands }));
        try { expect(await parseWorkbook(await workbookBytes(), c)).toEqual({ custom: 3 }); }
        finally { adapters.delete('test-custom'); }
    });
    it('handles slash sets, duplicate codes, roll case and numeric rooms', () => {
        const c = config();
        expect(normaliseUnit(' BB100 / AA100 / AA100 ', c)).toBe('AA100/BB100');
        expect(normaliseUnit('AA100/', c)).toBeNull();
        expect(normaliseRoll(' 2601cs39 ', c)).toBe('2601CS39');
        expect(normaliseRoom(102.0)).toBe('102');
        expect(normaliseRoom('102.0')).toBe('102');
        expect(normaliseRoom('LT001')).toBe('LT001');
        expect(normaliseRoom('Admin CC Lab 1')).toBe('Admin CC Lab 1');
        expect(parseDate(46347, c)).toBe('2026-11-21');
    });
    it('reads dates, formula-free enrolments, reverse-order units and optional-free rooms', async () => {
        const m = await parseWorkbook(await workbookBytes(), config());
        expect(m.timetable).toHaveLength(3);
        expect(m.enrolments.get('AA100/BB100').size).toBe(3);
        expect(m.rooms[0].room).toBe('102');
        expect([...m.holidays]).toEqual(['2026-11-24']);
    });
    it('handles comma/newline course separators and ignores unconfigured tabs', async () => {
        const sheets = fixtureSheets();
        sheets['EndSem Timetable'][1][1] = 'AA100/BB100,\nDD300';
        sheets['Ignored tab'] = [['secret', 'unrelated']];
        expect((await parseWorkbook(await workbookBytes(sheets), config())).timetable).toHaveLength(4);
    });
    it('changes layout, names, order, separator, date format, rolls and three slots through config alone', async () => {
        const fixture = JSON.parse(await readFile(new URL('./fixtures/alternate.json', import.meta.url)));
        const c = config(fixture.config);
        const m = await parseWorkbook(await workbookBytes(fixture.sheets), c);
        expect(m.timetable.map((e) => e.slotId)).toEqual(['late', 'early', 'noon']);
        expect(m.enrolments.get('AA100+BB100')).toEqual(new Set(['ST001', 'ST002']));
        expect(m.timetable[0].date).toBe('2026-12-05');
    });
    it('supports explicit one-based column positions', async () => {
        const c = config(); c.enrolments.columns = { unit: { position: 1 }, rolls: { position: 2 } };
        expect((await parseWorkbook(await workbookBytes(), c)).enrolments.size).toBe(4);
    });
    it.each([
        ['missing tab', (s) => { delete s['Room Allocation EndSem']; }, /tab 'Room Allocation EndSem' not found/],
        ['missing column', (s) => { s['Course Wise List'][0][1] = 'Different'; }, /column 'Rolls' missing in 'Course Wise List'/],
        ['bad date', (s) => { s['EndSem Timetable'][1][0] = 'impossible'; }, /Cannot parse date/],
        ['empty exams', (s) => { s['EndSem Timetable'] = [s['EndSem Timetable'][0]]; }, /No exam dates/],
        ['invalid roll', (s) => { s['Course Wise List'][1][1] = 'garbage'; }, /Invalid roll/],
        ['unknown slot', (s) => { s['Room Allocation EndSem'][1][1] = 'Night'; }, /Unknown slot/],
    ])('plain error for %s', async (_name, change, error) => {
        const sheets = fixtureSheets(); change(sheets);
        await expect(parseWorkbook(await workbookBytes(sheets), config())).rejects.toThrow(error);
    });
    it('rejects invalid registry references, regexes, timezone and required mappings', () => {
        const c = config();
        expect(() => validateRegistry({ activeDatasets: ['missing'], datasets: [c] })).toThrow(/not found/);
        expect(() => config({ timezone: 'Imaginary/Zone' })).toThrow(/timezone/);
        expect(() => config({ coursePattern: '[' })).toThrow(/regular expression/);
        expect(() => config({ rooms: { tab: 'X', columns: {} } })).toThrow(/rooms.columns/);
    });
    it('honours holiday overrides from config', async () => {
        const c = config({ holidays: { keywords: ['holiday'], dates: ['2026-11-21'] } });
        const m = await parseWorkbook(await workbookBytes(), c);
        expect(m.timetable.every((e) => e.date !== '2026-11-21')).toBe(true);
    });
});
