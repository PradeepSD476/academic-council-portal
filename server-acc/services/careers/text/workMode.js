// Work mode from an ATS workplace field when present, otherwise from keywords in the text.
// Returns ONSITE | HYBRID | REMOTE | UNKNOWN (unknown stays unknown; no default guess).

const HYBRID = /\bhybrid\b/i;
const REMOTE = /\b(remote|work from home|wfh|work from anywhere|fully distributed)\b/i;
const NOT_REMOTE = /\b(not|no|non)[\s-]+(an?\s+)?(fully\s+)?remote\b|\bremote\s+(work\s+)?(is\s+)?not\b/i;
const ONSITE = /\b(on[\s-]?site|in[\s-]office|work from office|wfo|office[\s-]based)\b/i;

function fromText(text) {
    if (typeof text !== 'string' || !text.trim()) return null;
    if (HYBRID.test(text)) return 'HYBRID';
    const remote = REMOTE.test(text) && !NOT_REMOTE.test(text);
    const onsite = ONSITE.test(text) || NOT_REMOTE.test(text);
    if (remote && onsite) return 'HYBRID';
    if (remote) return 'REMOTE';
    if (onsite) return 'ONSITE';
    return null;
}

// workplaceText: the ATS's own field (Lever workplaceType, Ashby workplaceType, "Remote" location).
export function detectWorkMode({ workplaceText, text } = {}) {
    return fromText(workplaceText) ?? fromText(text) ?? 'UNKNOWN';
}
