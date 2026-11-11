// Near-duplicate detection for job descriptions (cost-cascade tier 2): a 64-bit SimHash over
// 3-word shingles. Descriptions that differ only in formatting, whitespace or a line of
// boilerplate produce fingerprints a few bits apart; unrelated texts differ in ~32 bits.

const FNV_OFFSET = 0xcbf29ce484222325n;
const FNV_PRIME = 0x100000001b3n;
const MASK_64 = (1n << 64n) - 1n;
export const EMPTY_FINGERPRINT = '0'.repeat(16);

function fnv1a64(text) {
    let hash = FNV_OFFSET;
    for (let i = 0; i < text.length; i++) {
        hash ^= BigInt(text.charCodeAt(i));
        hash = (hash * FNV_PRIME) & MASK_64;
    }
    return hash;
}

function words(text) {
    return String(text ?? '')
        .normalize('NFKD')
        .replace(/\p{M}+/gu, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .split(' ')
        .filter(Boolean);
}

// Returns 16 lowercase hex chars.
export function simhash64(text) {
    const tokens = words(text);
    if (tokens.length === 0) return EMPTY_FINGERPRINT;
    const shingles = tokens.length < 3
        ? [tokens.join(' ')]
        : tokens.slice(0, tokens.length - 2).map((_, i) => `${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`);

    const weights = new Array(64).fill(0);
    for (const shingle of shingles) {
        const h = fnv1a64(shingle);
        for (let bit = 0; bit < 64; bit++) {
            weights[bit] += (h >> BigInt(bit)) & 1n ? 1 : -1;
        }
    }
    let result = 0n;
    for (let bit = 0; bit < 64; bit++) {
        if (weights[bit] > 0) result |= 1n << BigInt(bit);
    }
    return result.toString(16).padStart(16, '0');
}

export function hammingDistance(a, b) {
    let x = BigInt(`0x${a}`) ^ BigInt(`0x${b}`);
    let count = 0;
    while (x) {
        count += Number(x & 1n);
        x >>= 1n;
    }
    return count;
}

export const NEAR_DUPLICATE_MAX_DISTANCE = 3;

export function isNearDuplicate(a, b) {
    if (a === EMPTY_FINGERPRINT || b === EMPTY_FINGERPRINT) return false;
    return hammingDistance(a, b) <= NEAR_DUPLICATE_MAX_DISTANCE;
}
