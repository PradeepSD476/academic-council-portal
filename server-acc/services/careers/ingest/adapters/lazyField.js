// Converting a job's HTML description to text (cheerio) is the costly part of mapping a board, and
// the relevance filter drops most jobs on location or seniority without ever reading it (Stripe:
// ~700 of ~720). So adapters expose descriptionText as a field that is computed on first read and
// then behaves like a plain value (spread, Object.keys, JSON and assignment all work as before).
export function withLazyField(target, key, compute) {
    Object.defineProperty(target, key, {
        enumerable: true,
        configurable: true,
        get() {
            const value = compute();
            Object.defineProperty(this, key, { value, enumerable: true, configurable: true, writable: true });
            return value;
        },
        set(value) {
            Object.defineProperty(this, key, { value, enumerable: true, configurable: true, writable: true });
        },
    });
    return target;
}
