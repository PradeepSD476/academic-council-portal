// Cost of one model call in USD. A local model and the Gemini free tier cost 0 (tokens are still
// recorded). Paid Gemini prices per million tokens (input / output; thinking counts as output),
// valid until 31 Dec 2026 - check before relying on them later.
const PER_MTOK = {
    'gemini-3.1-flash-lite': { input: 0.25, output: 1.5 },
    'gemini-3.8-flash': { input: 0.75, output: 3.75 },
};

export function costUsd({ provider, model, usage, paidTier = false }) {
    if (provider !== 'gemini' || !paidTier) return 0;
    const price = PER_MTOK[model];
    if (!price) return null; // unknown paid model: caller records 0 and logs loudly
    return ((usage.inputTokens ?? 0) * price.input + (usage.outputTokens ?? 0) * price.output) / 1_000_000;
}

// Rough pre-call estimate for the paid budget check: input ~ chars/4 + 1500 prompt tokens, output ~ 1000.
export function estimateCostUsd({ provider, model, inputChars, paidTier }) {
    return costUsd({ provider, model, paidTier, usage: { inputTokens: Math.ceil(inputChars / 4) + 1500, outputTokens: 1000 } }) ?? 0;
}
