// The optional company on a Career Vault experience (addpost / editPost). undefined = not sent, so
// leave it as it is; null or "" = no company; otherwise the id of an ACTIVE company, else a 400.
import prisma from '../../../config/db.js';
import { CareersError } from '../errors.js';

export async function experienceCompanyId(value, db = prisma) {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    const id = Number(value);
    if (!['number', 'string'].includes(typeof value) || !Number.isInteger(id) || id <= 0) {
        throw new CareersError(400, 'VALIDATION_ERROR', 'Invalid company.');
    }
    const company = await db.company.findUnique({ where: { id }, select: { status: true } });
    if (company?.status !== 'ACTIVE') {
        throw new CareersError(400, 'VALIDATION_ERROR', 'That company can’t be selected. Pick another one or leave it empty.');
    }
    return id;
}
