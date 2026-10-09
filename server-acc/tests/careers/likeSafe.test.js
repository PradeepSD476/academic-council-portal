import { describe, it, expect } from 'vitest';
import { likeSafe } from '../../services/careers/text/likeSafe.js';

describe('likeSafe (B-14)', () => {
    it.each([
        ['%', '\\%'], ['_', '\\_'], ['50%_off', '50\\%\\_off'], ['a\\b', 'a\\\\b'], ['Stripe', 'Stripe'],
    ])('%s -> %s', (input, out) => {
        expect(likeSafe(input)).toBe(out);
    });
});
