// One error type for careers services, and one place that turns errors into the portal's JSON
// error shape. There is no global Express error handler, so every controller calls sendError.
import { ZodError } from 'zod';

export class CareersError extends Error {
    constructor(status, code, message, details) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
    }
}

export function sendError(res, err, context) {
    if (err instanceof CareersError) {
        return res.status(err.status).json({
            success: false,
            error: err.code,
            message: err.message,
            ...(err.details !== undefined ? { details: err.details } : {}),
        });
    }
    if (err instanceof ZodError) {
        return res.status(400).json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'The request is invalid.',
            details: err.issues.map((i) => ({ path: i.path.join('.'), issue: i.message })),
        });
    }
    if (err?.code === 'P2002') {
        return res.status(409).json({ success: false, error: 'CONFLICT', message: 'That value already exists.' });
    }
    if (err?.code === 'P2025') {
        return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'The record was not found.' });
    }
    console.error(`[careers] ${context}`, err);
    return res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Something went wrong. Please try again.',
    });
}

// Parses a positive integer route/query param or throws a 400.
export function parseId(value, name = 'id') {
    const n = Number(value);
    if (!Number.isInteger(n) || n <= 0) throw new CareersError(400, 'VALIDATION_ERROR', `Invalid ${name}.`);
    return n;
}
