import { describe, it, expect } from 'vitest';

describe('test harness', () => {
    it('runs ESM tests under node', async () => {
        const { createHash } = await import('node:crypto');
        expect(createHash('sha1').update('acc').digest('hex')).toHaveLength(40);
    });
});
