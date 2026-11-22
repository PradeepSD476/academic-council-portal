import { randomUUID } from 'node:crypto';

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const PHOTO_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const PHOTO_PATH = /^profile-photos\/([1-9]\d*)\/\d+-[0-9a-f-]{36}\.(jpg|png|webp)$/;

export class ProfileError extends Error {
    constructor(message, status = 400) { super(message); this.status = status; }
}

export const isOwnedPhoto = (path, userId) => typeof path === 'string' && PHOTO_PATH.exec(path)?.[1] === String(userId);

export function validateUploadRequest({ contentType, size } = {}) {
    if (!PHOTO_TYPES[contentType]) throw new ProfileError('Choose a JPEG, PNG, or WebP photo.');
    if (!Number.isInteger(size) || size <= 0) throw new ProfileError('The photo must not be empty.');
    if (size > MAX_PHOTO_BYTES) throw new ProfileError('The photo must be 5 MB or smaller.', 413);
}

export async function createPhotoUpload(userId, input, sign) {
    validateUploadRequest(input);
    if (!sign) ({ getUploadSignedUrl: sign } = await import('../../utils/signedUrl.js'));
    const { signedURL, filePath } = await sign({ fileName: `${randomUUID()}.${PHOTO_TYPES[input.contentType]}`, contentType: input.contentType, folder: `profile-photos/${userId}` });
    return { signedUrl: signedURL, filePath };
}

export function matchesImageSignature(bytes, contentType) {
    if (contentType === 'image/jpeg') return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    if (contentType === 'image/png') return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    if (contentType === 'image/webp') return bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
    return false;
}

export async function validateStoredPhoto(path, userId, dependencies = {}) {
    if (!isOwnedPhoto(path, userId)) throw new ProfileError('You can only use a photo uploaded to your own profile.', 403);
    const { storage, bucketName } = dependencies.storage ? dependencies : await import('../../config/minio.js');
    let stat;
    try { stat = await storage.statObject(bucketName, path); }
    catch { throw new ProfileError('Photo upload was not found. Please upload it again.', 422); }
    const type = Object.entries(stat.metaData || {}).find(([key]) => key.toLowerCase() === 'content-type')?.[1];
    validateUploadRequest({ contentType: type, size: stat.size });
    if (PHOTO_TYPES[type] !== path.split('.').pop()) throw new ProfileError('The photo format does not match the uploaded file.', 422);
    const stream = await storage.getPartialObject(bucketName, path, 0, 12);
    const chunks = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    if (!matchesImageSignature(Buffer.concat(chunks), type)) throw new ProfileError('The uploaded file is not a valid JPEG, PNG, or WebP image.', 422);
}

export async function removeOwnedPhoto(path, userId) {
    if (!isOwnedPhoto(path, userId)) return;
    try {
        const { storage, bucketName } = await import('../../config/minio.js');
        await storage.removeObject(bucketName, path);
    } catch (err) { console.error('[profile] Could not remove the previous photo:', err.message); }
}

export async function resolvePhotoURL(value, sign) {
    if (!value || typeof value !== 'string') return null;
    if (/^https?:\/\//i.test(value)) return value;
    if (!PHOTO_PATH.test(value)) return null;
    try {
        if (!sign) ({ getPublicUrl: sign } = await import('../../utils/signedUrl.js'));
        return await sign({ bucketName: process.env.MINIO_BUCKET_NAME, filePath: value });
    } catch (err) {
        console.error('[profile] Could not resolve a photo:', err.message);
        return null;
    }
}

// Keep existing nested author payloads compatible with photoURL now storing an object key.
// Dates, Prisma decimals and other non-plain values retain their normal JSON behaviour.
export async function resolveUserPhotos(data, sign) {
    const cache = new Map();
    async function visit(value) {
        if (Array.isArray(value)) return Promise.all(value.map(visit));
        if (!value || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) return value;
        return Object.fromEntries(await Promise.all(Object.entries(value).map(async ([key, item]) => {
            if (key !== 'photoURL') return [key, await visit(item)];
            if (!cache.has(item)) cache.set(item, resolvePhotoURL(item, sign));
            return [key, await cache.get(item)];
        })));
    }
    return visit(data);
}

export const safeUserSelect = Object.fromEntries(['id', 'displayName', 'email', 'photoURL', 'rollNo', 'branchName', 'admissionYear', 'program', 'role', 'createdAt', 'updatedAt', 'lastseen'].map((field) => [field, true]));
export async function safeUser(user) {
    const result = Object.fromEntries(Object.keys(safeUserSelect).filter((key) => key in user).map((key) => [key, user[key]]));
    result.photoURL = await resolvePhotoURL(user.photoURL);
    return result;
}
