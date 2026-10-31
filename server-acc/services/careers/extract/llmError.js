// The one error type providers throw, so runExtractions handles every vendor the same way.
//   UNREACHABLE | RATE_LIMIT | SERVER   -> retry later (backoff)
//   MODEL_MISSING | AUTH | BAD_REQUEST  -> the extraction fails
//   CONFIG                              -> provider not set up (stop; nothing is retried or failed)
export class LlmError extends Error {
    constructor(kind, message) {
        super(message);
        this.kind = kind;
    }
}

export const RETRYABLE = ['UNREACHABLE', 'RATE_LIMIT', 'SERVER'];
// Problems with the provider itself: stop the run (and show a red alert) instead of trying every row.
export const STOPS_RUN = ['UNREACHABLE', 'MODEL_MISSING', 'AUTH', 'CONFIG'];
