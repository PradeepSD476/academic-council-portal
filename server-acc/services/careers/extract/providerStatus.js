// { provider, reachable, modelPresent, keyPresent, lastError } for the operations page and for
// runExtractions' pre-flight check. A provider that is not usable raises a red alert there.
import { provider, providerName, modelFor } from './callModel.js';

export async function providerStatus() {
    const name = providerName();
    let p;
    try {
        p = provider();
    } catch (err) {
        return { provider: name, reachable: false, modelPresent: null, keyPresent: name === 'gemini' ? Boolean(process.env.GEMINI_API_KEY) : null, lastError: err.message };
    }
    const model = modelFor('LLM_FAST');
    const status = await p.status(model);
    return { provider: name, model, keyPresent: null, ...status };
}

export const isUsable = (s) => Boolean(s.reachable && s.modelPresent !== false && s.keyPresent !== false);
