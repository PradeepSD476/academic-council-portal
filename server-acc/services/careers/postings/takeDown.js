// Take down a LIVE posting (P5-T2, F-02 level 1; decision D-02). Reversible: "Closed" expires it, so
// students who saved it still see it as "No longer live"; every other reason rejects it, which hides
// it from every student view. Both can be reopened. The reason -> action rule is pure.
import { z } from 'zod';
import prisma from '../../../config/db.js';
import { CareersError } from '../errors.js';
import { expirePosting, rejectPosting } from './reviewService.js';

export const TAKE_DOWN_REASONS = [
    { value: 'CLOSED', label: 'closed', action: 'expire' },
    { value: 'NOT_FOR_STUDENTS', label: 'not for students', action: 'reject' },
    { value: 'DUPLICATE', label: 'duplicate of another posting', action: 'reject' },
    { value: 'SPAM', label: 'spam or not a real opening', action: 'reject' },
    { value: 'WRONG_DETAILS', label: 'wrong details', action: 'reject' },
    { value: 'OTHER', label: null, action: 'reject' },
];
const BY_VALUE = new Map(TAKE_DOWN_REASONS.map((r) => [r.value, r]));

export const takeDownBody = z.object({
    reason: z.enum(TAKE_DOWN_REASONS.map((r) => r.value)),
    details: z.string().trim().min(1).max(300).optional(),
}).strict().refine((b) => b.reason !== 'OTHER' || b.details, { message: 'Say why when the reason is "Other".', path: ['details'] });

export function takeDownPlan({ reason, details }) {
    const r = BY_VALUE.get(reason);
    const text = r.label ? `Taken down: ${r.label}${details ? ` (${details})` : ''}` : `Taken down: ${details}`;
    return { action: r.action, text };
}

export async function takeDownPosting(id, body, userId, db = prisma) {
    const posting = await db.posting.findUnique({ where: { id }, select: { status: true } });
    if (!posting) throw new CareersError(404, 'NOT_FOUND', `Posting #${id} was not found.`);
    if (posting.status !== 'LIVE') throw new CareersError(409, 'CONFLICT', `Only a LIVE posting can be taken down (this one is ${posting.status}).`);
    const plan = takeDownPlan(body);
    const result = plan.action === 'expire' ? await expirePosting(id, userId, plan.text) : await rejectPosting(id, plan.text, userId);
    return { ...result, action: plan.action };
}
