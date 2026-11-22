import { describe, it, expect, vi } from 'vitest';
import { Readable } from 'node:stream';
import { resolvePhotoURL, resolveUserPhotos, isOwnedPhoto, createPhotoUpload, validateStoredPhoto, validateUploadRequest, matchesImageSignature, MAX_PHOTO_BYTES, safeUser } from '../../services/profile/photos.js';

const path = 'profile-photos/7/1795300000000-12345678-1234-1234-1234-123456789abc.png';
const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
const storage = (type = 'image/png', bytes = png, size = 100) => ({ statObject: vi.fn(async () => ({ size, metaData: { 'content-type': type } })), getPartialObject: vi.fn(async () => Readable.from([bytes])) });

describe('profile photo storage validation', () => {
    it('accepts owner-scoped paths and rejects traversal, URLs and other users', () => {
        expect(isOwnedPhoto(path, 7)).toBe(true);
        for (const bad of [path, 'https://example.org/photo.png', '../other.png', 'profile-photos/7/../../other.png']) expect(isOwnedPhoto(bad, 8)).toBe(false);
    });
    it('signs only a generated filename under the authenticated user prefix', async () => {
        const sign = vi.fn(async () => ({ signedURL: 'https://storage/upload', filePath: path }));
        expect(await createPhotoUpload(7, { contentType: 'image/png', size: 100 }, sign)).toEqual({ signedUrl: 'https://storage/upload', filePath: path });
        expect(sign.mock.calls[0][0]).toMatchObject({ folder: 'profile-photos/7', contentType: 'image/png' });
        expect(sign.mock.calls[0][0].fileName).toMatch(/^[0-9a-f-]{36}\.png$/);
    });
    it.each([
        [{ contentType: 'image/svg+xml', size: 100 }, /JPEG/],
        [{ contentType: 'image/gif', size: 100 }, /JPEG/],
        [{ contentType: 'image/png', size: 0 }, /empty/],
        [{ contentType: 'image/png', size: MAX_PHOTO_BYTES + 1 }, /5 MB/],
    ])('rejects unsupported or invalid upload metadata %j', (input, error) => expect(() => validateUploadRequest(input)).toThrow(error));
    it('checks actual object size, content type, extension and image bytes before saving', async () => {
        const client = storage();
        await validateStoredPhoto(path, 7, { storage: client, bucketName: 'media' });
        expect(client.getPartialObject).toHaveBeenCalledWith('media', path, 0, 12);
        await expect(validateStoredPhoto(path, 8, { storage: client, bucketName: 'media' })).rejects.toMatchObject({ status: 403 });
        await expect(validateStoredPhoto(path, 7, { storage: storage('image/png', Buffer.from('<script>bad</script>')), bucketName: 'media' })).rejects.toThrow(/not a valid/);
        await expect(validateStoredPhoto(path, 7, { storage: storage('image/png', png, MAX_PHOTO_BYTES + 1), bucketName: 'media' })).rejects.toMatchObject({ status: 413 });
        await expect(validateStoredPhoto(path, 7, { storage: storage('image/jpeg'), bucketName: 'media' })).rejects.toThrow(/format does not match/);
    });
    it('fails clearly when an upload has not completed', async () => {
        await expect(validateStoredPhoto(path, 7, { storage: { statObject: async () => { throw new Error('NoSuchKey'); } }, bucketName: 'media' })).rejects.toMatchObject({ status: 422 });
    });
    it('recognises JPEG and WebP signatures too', () => {
        expect(matchesImageSignature(Buffer.from([255, 216, 255, 0]), 'image/jpeg')).toBe(true);
        expect(matchesImageSignature(Buffer.from('RIFF0000WEBP'), 'image/webp')).toBe(true);
        expect(matchesImageSignature(Buffer.from('RIFF0000FAKE'), 'image/webp')).toBe(false);
    });
});

describe('stored path to viewing URL compatibility', () => {
    it('preserves legacy HTTP URLs and signs object keys without modifying stored values', async () => {
        const sign = vi.fn(async () => 'https://storage/signed-photo');
        expect(await resolvePhotoURL('https://example.org/old.jpg', sign)).toBe('https://example.org/old.jpg');
        expect(sign).not.toHaveBeenCalled();
        expect(await resolvePhotoURL(path, sign)).toBe('https://storage/signed-photo');
        expect(sign.mock.calls[0][0].filePath).toBe(path);
        expect(await resolvePhotoURL(null, sign)).toBeNull();
        expect(await resolvePhotoURL('javascript:alert(1)', sign)).toBeNull();
    });
    it('deduplicates signing within a response and resolves nested authors/replies', async () => {
        const date = new Date('2026-11-22');
        class DecimalLike { toJSON() { return '4.0'; } }
        const decimal = new DecimalLike();
        const data = { date, decimal, author: { photoURL: path }, replies: [{ author: { photoURL: path } }], faculty: { photoUrl: 'https://example.org/faculty.png' } };
        const sign = vi.fn(async () => 'https://storage/photo');
        const result = await resolveUserPhotos(data, sign);
        expect(result.author.photoURL).toBe('https://storage/photo');
        expect(result.replies[0].author.photoURL).toBe('https://storage/photo');
        expect(result.date).toBe(date); expect(result.decimal).toBe(decimal);
        expect(result.faculty.photoUrl).toBe(data.faculty.photoUrl);
        expect(data.author.photoURL).toBe(path); expect(sign).toHaveBeenCalledOnce();
    });
    it('returns avatar fallback if signing fails without rejecting the whole response', async () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(await resolvePhotoURL(path, async () => { throw new Error('storage offline'); })).toBeNull();
        spy.mockRestore();
    });
    it('never exposes passwords or unrelated private fields', async () => {
        expect(await safeUser({ id: 7, displayName: 'A', photoURL: null, password: 'secret', cpi: '9.0', token: 'secret' })).toEqual({ id: 7, displayName: 'A', photoURL: null });
    });
});
