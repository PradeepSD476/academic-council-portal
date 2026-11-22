import { describe, it, expect, vi, beforeEach } from 'vitest';
const mocks = vi.hoisted(() => ({ user: { update: vi.fn(), updateMany: vi.fn(), findUnique: vi.fn(), findMany: vi.fn() }, validate: vi.fn(), remove: vi.fn(), upload: vi.fn() }));
vi.mock('../../config/db.js', () => ({ default: { user: mocks.user } }));
vi.mock('../../services/profile/photos.js', async (original) => ({ ...await original(), validateStoredPhoto: mocks.validate, removeOwnedPhoto: mocks.remove, createPhotoUpload: mocks.upload }));
vi.mock('../../utils/signedUrl.js', () => ({ getPublicUrl: async ({ filePath }) => `https://storage/${filePath}?signed=yes` }));
import { editProfile, getPhotoUpload, getProfilePhoto, updateProfile } from '../../controllers/profileController.js';
import { getMe, getUsers } from '../../controllers/userController.js';

const path = 'profile-photos/7/1795300000000-12345678-1234-1234-1234-123456789abc.png';
const user = { id: 7, role: 'STUDENT', displayName: 'Old Name', rollNo: '2401AI33', email: 'one@example.org', photoURL: null };
const response = () => ({ code: null, body: null, headers: {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; }, set(key, value) { this.headers[key] = value; return this; } });
async function call(handler, options = {}) {
    const res = response(); await handler({ user: { ...user }, body: {}, params: {}, query: {}, ...options }, res); return res;
}
beforeEach(() => {
    vi.resetAllMocks();
    mocks.user.update.mockImplementation(async ({ data }) => ({ ...user, ...data }));
    mocks.validate.mockResolvedValue(undefined); mocks.remove.mockResolvedValue(undefined);
});

describe('self profile updates', () => {
    it('updates only the authenticated account, trims name and returns safe fields', async () => {
        const res = await call(editProfile, { body: { displayName: '  New Name  ' } });
        expect(res.code).toBe(200); expect(res.body.data.displayName).toBe('New Name');
        expect(mocks.user.update.mock.calls[0][0]).toMatchObject({ where: { id: 7 }, data: { displayName: 'New Name' } });
        expect(res.body.data).not.toHaveProperty('password');
        expect(mocks.validate).not.toHaveBeenCalled(); expect(mocks.remove).not.toHaveBeenCalled();
    });
    it.each([{}, { displayName: '' }, { displayName: '   ' }, { displayName: 'a'.repeat(101) }, { displayName: 7 }, { email: 'new@example.org' }, { rollNo: '2401CS01' }, { rollNumber: '2401CS01' }, { role: 'SUPER_ADMIN' }, { userId: 8 }, { branchName: 'CS' }])('rejects invalid/restricted edit %j', async (body) => {
        expect((await call(editProfile, { body })).code).toBe(400);
        expect(mocks.user.update).not.toHaveBeenCalled();
    });
    it('validates an uploaded path before storing it and returns a signed URL', async () => {
        const res = await call(editProfile, { body: { photoURL: path } });
        expect(res.code).toBe(200);
        expect(mocks.validate).toHaveBeenCalledWith(path, 7);
        expect(mocks.user.update.mock.calls[0][0].data.photoURL).toBe(path);
        expect(res.body.data.photoURL).toContain('?signed=yes');
    });
    it('rejects invalid uploads atomically without modifying name or previous photo', async () => {
        mocks.validate.mockRejectedValue(Object.assign(new Error('Not your upload'), { status: 403 }));
        const res = await call(editProfile, { body: { displayName: 'Changed', photoURL: path } });
        expect(res.code).toBe(403); expect(mocks.user.update).not.toHaveBeenCalled();
        expect(mocks.remove).not.toHaveBeenCalled();
    });
    it('removes an optional photo and cleans up only after the DB update succeeds', async () => {
        const res = await call(editProfile, { user: { ...user, photoURL: path }, body: { photoURL: null } });
        expect(res.code).toBe(200); expect(res.body.data.photoURL).toBeNull();
        expect(mocks.remove).toHaveBeenCalledWith(path, 7);
        expect(mocks.user.update.mock.invocationCallOrder[0]).toBeLessThan(mocks.remove.mock.invocationCallOrder[0]);
        mocks.remove.mockClear(); mocks.user.update.mockRejectedValue(new Error('DB unavailable'));
        expect((await call(editProfile, { user: { ...user, photoURL: path }, body: { photoURL: null } })).code).toBe(500);
        expect(mocks.remove).not.toHaveBeenCalled();
    });
    it('returns profile-safe fields from existing current-user and admin endpoints', async () => {
        const privateUser = { ...user, photoURL: path, password: 'hidden', cpi: 9 };
        const me = await call(getMe, { user: privateUser });
        expect(me.body.data).not.toHaveProperty('password'); expect(me.body.data).not.toHaveProperty('cpi');
        mocks.user.findMany.mockResolvedValue([privateUser]);
        const admin = await call(getUsers, { query: { page: '1', limit: '10', activity: 'online' } });
        expect(admin.body.data[0].photoURL).toContain('?signed=yes');
        expect(admin.body.data[0]).not.toHaveProperty('password');
        expect(mocks.user.findMany.mock.calls[0][0].where.lastseen.gt).toBeInstanceOf(Date);
    });
});

describe('profile photo upload and viewing', () => {
    it('returns a signed upload with the standard response format', async () => {
        mocks.upload.mockResolvedValue({ signedUrl: 'https://storage/upload', filePath: path });
        const res = await call(getPhotoUpload, { body: { size: 100, contentType: 'image/png' } });
        expect(res.code).toBe(200); expect(res.body).toMatchObject({ signedUrl: 'https://storage/upload', filePath: path });
        expect(mocks.upload).toHaveBeenCalledWith(7, { size: 100, contentType: 'image/png' });
        expect((await call(getPhotoUpload, { body: { size: 100, contentType: 'image/png', userId: 8 } })).code).toBe(400);
    });
    it('permits the owner and existing Manage Users roles, rejects other viewers', async () => {
        mocks.user.findUnique.mockResolvedValue({ photoURL: path });
        for (const viewer of [user, { id: 8, role: 'SUPER_ADMIN' }, { id: 8, role: 'FACULTY' }]) {
            const res = await call(getProfilePhoto, { user: viewer, params: { id: '7' } });
            expect(res.code).toBe(200); expect(res.body.data.photoURL).toContain('?signed=yes');
            expect(res.headers['Cache-Control']).toBe('no-store');
        }
        expect((await call(getProfilePhoto, { user: { id: 8, role: 'STUDENT' }, params: { id: '7' } })).code).toBe(403);
        expect((await call(getProfilePhoto, { params: { id: '../7' } })).code).toBe(400);
    });
    it('handles missing photos and missing accounts', async () => {
        mocks.user.findUnique.mockResolvedValue({ photoURL: null });
        expect((await call(getProfilePhoto, { params: { id: '7' } })).body.data.photoURL).toBeNull();
        mocks.user.findUnique.mockResolvedValue(null);
        expect((await call(getProfilePhoto, { params: { id: '7' } })).code).toBe(404);
    });
});

describe('initial roll verification compatibility', () => {
    it('does not allow an existing roll to be reassigned', async () => {
        expect((await call(updateProfile, { body: { rollNumber: '2401CS01' } })).code).toBe(409);
        expect(mocks.user.updateMany).not.toHaveBeenCalled();
    });
    it('assigns a first roll with a conditional update and safe result', async () => {
        mocks.user.updateMany.mockResolvedValue({ count: 1 }); mocks.user.findUnique.mockResolvedValue(user);
        const res = await call(updateProfile, { user: { ...user, rollNo: null }, body: { rollNumber: '2401AI33' } });
        expect(res.code).toBe(200);
        expect(mocks.user.updateMany.mock.calls[0][0].where).toMatchObject({ id: 7, OR: [{ rollNo: null }, { rollNo: '' }] });
        mocks.user.updateMany.mockResolvedValue({ count: 0 });
        expect((await call(updateProfile, { user: { ...user, rollNo: null }, body: { rollNumber: '2401AI33' } })).code).toBe(409);
    });
});
