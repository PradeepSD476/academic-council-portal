import ExcelJS from 'exceljs';
import { parseMappedWorkbook } from './adapters/mapped.js';

// Add a differently shaped workbook here; scheduling, student matching and mail stay unchanged.
export const adapters = new Map([['mapped', parseMappedWorkbook]]);

export async function parseWorkbook(bytes, config) {
    const adapter = adapters.get(config.adapter);
    if (!adapter) throw new Error(`Unknown exam parser adapter '${config.adapter}'`);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes);
    return adapter(workbook, config);
}
