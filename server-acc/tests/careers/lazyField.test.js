import { describe, it, expect, vi } from 'vitest';
import { withLazyField } from '../../services/careers/ingest/adapters/lazyField.js';
import * as greenhouse from '../../services/careers/ingest/adapters/greenhouse.js';
import { evaluateRelevance } from '../../services/careers/text/relevance.js';

describe('withLazyField', () => {
    it('computes only when read, then once', () => {
        const compute = vi.fn(() => 'text');
        const obj = withLazyField({ a: 1 }, 'descriptionText', compute);
        expect(compute).not.toHaveBeenCalled();
        expect(obj.descriptionText).toBe('text');
        expect(obj.descriptionText).toBe('text');
        expect(compute).toHaveBeenCalledTimes(1);
    });
    it('behaves like a plain field for spread, keys and JSON', () => {
        const obj = withLazyField({ a: 1 }, 'descriptionText', () => 'text');
        expect(Object.keys(obj)).toEqual(['a', 'descriptionText']);
        expect({ ...obj }).toEqual({ a: 1, descriptionText: 'text' });
        expect(JSON.parse(JSON.stringify(obj))).toEqual({ a: 1, descriptionText: 'text' });
    });
    it('can be overwritten like a plain field', () => {
        const obj = withLazyField({}, 'descriptionText', () => 'text');
        obj.descriptionText = 'edited';
        expect(obj.descriptionText).toBe('edited');
    });
});

describe('relevance never converts the description of a job it drops on location or seniority', () => {
    const job = (title, location) => ({ id: 1, title, absolute_url: 'https://x.test/1', location: { name: location }, content: '&lt;p&gt;Hi&lt;/p&gt;' });
    it.each([
        ['Software Engineer', 'San Francisco, CA'],
        ['Senior Software Engineer', 'Bengaluru, India'],
    ])('%s in %s', (title, location) => {
        const raw = greenhouse.mapJob(job(title, location));
        const spy = vi.fn(() => 'unused');
        Object.defineProperty(raw, 'descriptionText', { get: spy, enumerable: true, configurable: true });
        expect(evaluateRelevance(raw).keep).toBe(false);
        expect(spy).not.toHaveBeenCalled();
    });
});
