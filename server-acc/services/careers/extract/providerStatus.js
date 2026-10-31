// { provider, reachable, modelPresent, keyPresent, lastError } for the operations page and for
// runExtractions' pre-flight check. A provider that is not usable raises a red alert there.
import { provider, providerName, modelFor } from './callModel.js';

const KEY_ENV = { gemini: 'GEMINI_API_KEY', groq: 'GROQ_API_KEY' };
export const keyPresentFor = (name) => (KEY_ENV[name] ? Boolean(process.env[KEY_ENV[name]]?.trim()) : null);

export async function providerStatus() {
    const name = providerName();
    let p;
    try {
        p = provider();
    } catch (err) {
        return { provider: name, reachable: false, modelPresent: null, keyPresent: keyPresentFor(name), lastError: err.message };
    }
    const model = modelFor('LLM_FAST');
    const status = await p.status(model);
    return { provider: name, model, keyPresent: keyPresentFor(name), ...status };
}

export const isUsable = (s) => Boolean(s.reachable && s.modelPresent !== false && s.keyPresent !== false);
