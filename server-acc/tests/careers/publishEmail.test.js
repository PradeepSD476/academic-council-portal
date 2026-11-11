import { describe, it, expect, vi, beforeEach } from 'vitest';

// B-49: upstream's "new experience" email goes to every user, so it must fire once, when an
// experience goes live, never on a later edit. The mailer is mocked: nothing is sent.
const notifyOnNewPost = vi.fn();
const db = { experience: { findUnique: vi.fn(), update: vi.fn() } };
vi.mock('../../config/db.js', () => ({ default: db }));
vi.mock('../../config/minio.js', () => ({ storage: { removeObject: vi.fn() } }));
vi.mock('../../utils/mail/sendExperiencePost.js', () => ({ default: notifyOnNewPost }));
vi.mock('../../utils/mail/sendCommentNotification.js', () => ({ default: vi.fn() }));
vi.mock('../../utils/mail/sendReplyNotification.js', () => ({ default: vi.fn() }));
const { editPost } = await import('../../controllers/ForumController.js');

async function save(currentStatus, status) {
    db.experience.findUnique.mockResolvedValue({ id: 7, status: currentStatus, uploadedBy: { id: 1, displayName: 'A' } });
    db.experience.update.mockResolvedValue({ id: 7, status });
    const res = { statusCode: 0, status(c) { this.statusCode = c; return this; }, json() { return this; } };
    const body = { title: 'T', description: '<p>d</p>', experienceType: 'INTERNSHIP', status, domain: 'CS' };
    await editPost({ params: { id: '7' }, user: { id: 2 }, body }, res);
    return res;
}

describe('email on publishing an experience (B-49)', () => {
    beforeEach(() => { notifyOnNewPost.mockReset(); db.experience.update.mockReset(); });

    it('a draft going live emails once', async () => {
        const res = await save('DRAFT', 'PUBLISHED');
        expect(res.statusCode).toBe(201);
        expect(notifyOnNewPost).toHaveBeenCalledTimes(1);
    });
    it('saving an already published experience sends nothing, and still saves', async () => {
        const res = await save('PUBLISHED', 'PUBLISHED');
        expect(res.statusCode).toBe(201);
        expect(db.experience.update).toHaveBeenCalledTimes(1);
        expect(notifyOnNewPost).not.toHaveBeenCalled();
    });
    it('saving as a draft sends nothing', async () => {
        await save('DRAFT', 'DRAFT');
        await save('PUBLISHED', 'DRAFT');
        expect(notifyOnNewPost).not.toHaveBeenCalled();
    });
});
