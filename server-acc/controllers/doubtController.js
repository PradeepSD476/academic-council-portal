import prisma from '../config/db.js';
import { getPublicUrl } from '../utils/signedUrl.js';
import sendDoubtAnswerNotification from '../utils/mail/sendDoubtAnswerNotification.js';

// ---------------------------------------------------------------------------
// ACC Wiki: doubt-resolution forum
// ---------------------------------------------------------------------------

export const DOUBT_CATEGORIES = [
    'Academics',
    'Administration',
    'Fees & Scholarships',
    'Hostel & Mess',
    'Placements & Internships',
    'Campus Life',
    'Tech & Projects',
    'Other',
];

// Roles allowed to moderate the forum. Keep in sync with middlewares/checkDoubtAdmin.js
export const DOUBT_ADMIN_ROLES = ['SUPER_ADMIN', 'FACULTY'];

const TITLE_MIN = 8;
const TITLE_MAX = 150;
const BODY_MAX = 20000;
const REASON_MAX = 500;

const isDoubtAdmin = (user) => DOUBT_ADMIN_ROLES.includes(user?.role);

const authorSelect = { id: true, displayName: true, branchName: true, admissionYear: true, role: true };

const fail = (res, status, message, error) =>
    res.status(status).json({ success: false, ...(error ? { error } : {}), message });

const serverError = (res, error) => {
    console.log(error);
    return fail(res, 500, 'Something went wrong. Please try again later.', 'Internal Server Error');
};

const parseId = (value) => {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
};

const cleanText = (value) => (typeof value === 'string' ? value.trim() : '');

// Images are stored in the Markdown as  ![alt](media:doubts/<file>)  and turned
// into short-lived signed URLs when the text is sent to the browser. Only files
// under the "doubts/" folder are ever signed, so the forum cannot be used to
// read other files in the bucket (resumes, course resources, ...).
const MEDIA_LINK = /\]\(media:(doubts\/[A-Za-z0-9._-]+)\)/g;

const resolveImages = async (markdown) => {
    if (!markdown || !markdown.includes('](media:')) return markdown;

    const paths = [...new Set([...markdown.matchAll(MEDIA_LINK)].map((m) => m[1]))];
    const urls = {};
    await Promise.all(
        paths.map(async (filePath) => {
            try {
                urls[filePath] = await getPublicUrl({
                    bucketName: process.env.MINIO_BUCKET_NAME,
                    filePath,
                });
            } catch (err) {
                console.error('Failed to resolve forum image', filePath, err?.message);
            }
        })
    );

    return markdown.replace(MEDIA_LINK, (whole, filePath) =>
        urls[filePath] ? `](${urls[filePath]})` : whole
    );
};

// Plain-text preview for the list page.
const makeExcerpt = (markdown = '', length = 220) => {
    const text = markdown
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/^\s*(#{1,6}|>|[-*]|\d+[.)])\s+/gm, '')
        .replace(/^\s*(-{3,}|\*{3,})\s*$/gm, ' ')
        .replace(/[*_`~]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    return text.length > length ? `${text.slice(0, length).trimEnd()}…` : text;
};

const validateDoubtInput = ({ title, body, category }, { partial = false } = {}) => {
    const data = {};

    if (title !== undefined || !partial) {
        const t = cleanText(title);
        if (t.length < TITLE_MIN || t.length > TITLE_MAX) {
            return { error: `Title must be between ${TITLE_MIN} and ${TITLE_MAX} characters.` };
        }
        data.title = t;
    }
    if (body !== undefined || !partial) {
        const b = cleanText(body);
        if (!b) return { error: 'Please describe your doubt.' };
        if (b.length > BODY_MAX) return { error: `Description is too long (max ${BODY_MAX} characters).` };
        data.body = b;
    }
    if (category !== undefined || !partial) {
        if (!DOUBT_CATEGORIES.includes(category)) return { error: 'Please choose a valid category.' };
        data.category = category;
    }
    return { data };
};

// ------------------------------- Doubts ------------------------------------

export const getCategories = (req, res) =>
    res.status(200).json({ success: true, data: DOUBT_CATEGORIES });

export const getDoubts = async (req, res) => {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
    const search = cleanText(req.query.search);
    const { category, status, sort } = req.query;
    const admin = isDoubtAdmin(req.user);
    const userId = req.user.id;

    const where = {};
    // Hidden threads are only ever listed for moderators (admin panel).
    if (!(admin && req.query.includeHidden === 'true')) where.isHidden = false;
    if (category && category !== 'All') where.category = category;
    if (status === 'OPEN' || status === 'RESOLVED') where.status = status;
    if (req.query.mine === 'true') where.authorId = userId;
    if (sort === 'unanswered') where.answers = { none: { isHidden: false } };
    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { body: { contains: search, mode: 'insensitive' } },
        ];
    }

    const orderBy = [{ isPinned: 'desc' }];
    if (sort === 'top') orderBy.push({ votes: { _count: 'desc' } });
    orderBy.push({ createdAt: 'desc' });

    try {
        const [rows, total] = await Promise.all([
            prisma.doubt.findMany({
                where,
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    author: { select: authorSelect },
                    votes: { where: { userId }, select: { id: true } },
                    _count: {
                        select: {
                            votes: true,
                            answers: { where: { isHidden: false } },
                            reports: { where: { status: 'PENDING' } },
                        },
                    },
                },
            }),
            prisma.doubt.count({ where }),
        ]);

        const data = rows.map(({ body, votes, _count, ...doubt }) => ({
            ...doubt,
            excerpt: makeExcerpt(body),
            voteCount: _count.votes,
            answerCount: _count.answers,
            hasVoted: votes.length > 0,
            ...(admin ? { pendingReports: _count.reports } : {}),
        }));

        return res.status(200).json({
            success: true,
            message: 'Data fetched Successfully',
            data,
            pagination: { total, page, limit, totalPages: Math.max(Math.ceil(total / limit), 1) },
        });
    } catch (error) {
        return serverError(res, error);
    }
};

export const getDoubt = async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, 'Invalid doubt id.');
    const admin = isDoubtAdmin(req.user);
    const userId = req.user.id;

    try {
        const doubt = await prisma.doubt.findUnique({
            where: { id },
            include: {
                author: { select: authorSelect },
                votes: { where: { userId }, select: { id: true } },
                _count: { select: { votes: true } },
                answers: {
                    where: admin ? {} : { isHidden: false },
                    orderBy: [{ isAccepted: 'desc' }, { createdAt: 'asc' }],
                    include: {
                        author: { select: authorSelect },
                        votes: { where: { userId }, select: { id: true } },
                        _count: { select: { votes: true } },
                    },
                },
            },
        });

        if (!doubt || (doubt.isHidden && !admin)) {
            return fail(res, 404, 'This doubt does not exist or was removed.', 'NotFound');
        }

        const { votes, _count, answers, ...rest } = doubt;
        const data = {
            ...rest,
            body: await resolveImages(rest.body),
            rawBody: rest.body,
            voteCount: _count.votes,
            hasVoted: votes.length > 0,
            canEdit: admin || rest.authorId === userId,
            canModerate: admin,
            answers: await Promise.all(
                answers.map(async ({ votes: aVotes, _count: aCount, ...answer }) => ({
                    ...answer,
                    body: await resolveImages(answer.body),
                    rawBody: answer.body,
                    voteCount: aCount.votes,
                    hasVoted: aVotes.length > 0,
                    canEdit: admin || answer.authorId === userId,
                }))
            ),
        };

        return res.status(200).json({ success: true, message: 'Data fetched Successfully', data });
    } catch (error) {
        return serverError(res, error);
    }
};

export const createDoubt = async (req, res) => {
    const { data, error } = validateDoubtInput(req.body || {});
    if (error) return fail(res, 400, error, 'ValidationError');

    try {
        const doubt = await prisma.doubt.create({ data: { ...data, authorId: req.user.id } });
        return res.status(201).json({ success: true, message: 'Your doubt has been posted.', data: doubt });
    } catch (err) {
        return serverError(res, err);
    }
};

export const updateDoubt = async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, 'Invalid doubt id.');
    const { data, error } = validateDoubtInput(req.body || {}, { partial: true });
    if (error) return fail(res, 400, error, 'ValidationError');
    if (Object.keys(data).length === 0) return fail(res, 400, 'Nothing to update.');

    try {
        const doubt = await prisma.doubt.findUnique({ where: { id } });
        if (!doubt) return fail(res, 404, 'Doubt not found.', 'NotFound');
        if (doubt.authorId !== req.user.id && !isDoubtAdmin(req.user)) {
            return fail(res, 403, 'You can only edit your own doubt.');
        }
        const updated = await prisma.doubt.update({ where: { id }, data });
        return res.status(200).json({ success: true, message: 'Doubt updated.', data: updated });
    } catch (err) {
        return serverError(res, err);
    }
};

export const deleteDoubt = async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, 'Invalid doubt id.');

    try {
        const doubt = await prisma.doubt.findUnique({ where: { id } });
        if (!doubt) return fail(res, 404, 'Doubt not found.', 'NotFound');
        if (doubt.authorId !== req.user.id && !isDoubtAdmin(req.user)) {
            return fail(res, 403, 'You can only delete your own doubt.');
        }
        // Answers, votes and reports are removed by the database (ON DELETE CASCADE).
        await prisma.doubt.delete({ where: { id } });
        return res.status(200).json({ success: true, message: 'Doubt deleted.' });
    } catch (err) {
        return serverError(res, err);
    }
};

// Author or moderator: mark a doubt resolved / reopen it.
export const setDoubtStatus = async (req, res) => {
    const id = parseId(req.params.id);
    const status = req.body?.status;
    if (!id) return fail(res, 400, 'Invalid doubt id.');
    if (status !== 'OPEN' && status !== 'RESOLVED') return fail(res, 400, 'Status must be OPEN or RESOLVED.');

    try {
        const doubt = await prisma.doubt.findUnique({ where: { id } });
        if (!doubt) return fail(res, 404, 'Doubt not found.', 'NotFound');
        if (doubt.authorId !== req.user.id && !isDoubtAdmin(req.user)) {
            return fail(res, 403, 'Only the person who asked can change the status.');
        }

        await prisma.$transaction(async (tx) => {
            await tx.doubt.update({ where: { id }, data: { status } });
            // Reopening a doubt clears the accepted answer.
            if (status === 'OPEN') {
                await tx.doubtAnswer.updateMany({ where: { doubtId: id }, data: { isAccepted: false } });
            }
        });

        return res.status(200).json({
            success: true,
            message: status === 'RESOLVED' ? 'Marked as resolved.' : 'Doubt reopened.',
            data: { status },
        });
    } catch (err) {
        return serverError(res, err);
    }
};

// ------------------------------- Answers -----------------------------------

export const addAnswer = async (req, res) => {
    const doubtId = parseId(req.params.id);
    const body = cleanText(req.body?.body);
    if (!doubtId) return fail(res, 400, 'Invalid doubt id.');
    if (!body) return fail(res, 400, 'Answer cannot be empty.', 'ValidationError');
    if (body.length > BODY_MAX) return fail(res, 400, `Answer is too long (max ${BODY_MAX} characters).`, 'ValidationError');

    try {
        const doubt = await prisma.doubt.findUnique({
            where: { id: doubtId },
            include: { author: { select: { email: true, displayName: true } } },
        });
        const admin = isDoubtAdmin(req.user);
        if (!doubt || (doubt.isHidden && !admin)) return fail(res, 404, 'Doubt not found.', 'NotFound');
        if (doubt.isLocked && !admin) return fail(res, 403, 'This discussion is locked by a moderator.');

        const answer = await prisma.doubtAnswer.create({
            data: { body, doubtId, authorId: req.user.id },
        });

        // Email the person who asked. Skipped when they answer their own doubt.
        // Sent in the background so a slow or failing mail server never blocks the answer.
        if (doubt.authorId !== req.user.id && doubt.author?.email) {
            notifyAsker({ doubt, answerer: req.user, body });
        }

        return res.status(201).json({ success: true, message: 'Answer posted.', data: answer });
    } catch (err) {
        return serverError(res, err);
    }
};

const threadLink = (doubtId) => {
    const base = (process.env.PUBLIC_DOMAIN || process.env.CLIENT_URL || '').replace(/\/+$/, '');
    return base ? `${base}/dashboard/doubts/${doubtId}` : null;
};

const notifyAsker = ({ doubt, answerer, body }) => {
    sendDoubtAnswerNotification({
        to: doubt.author.email,
        askerName: doubt.author.displayName,
        answererName: answerer.displayName,
        doubtTitle: doubt.title,
        answerPreview: makeExcerpt(body, 300),
        threadUrl: threadLink(doubt.id),
    }).catch((err) => console.error('Failed to send doubt answer notification:', err?.message || err));
};

export const updateAnswer = async (req, res) => {
    const id = parseId(req.params.id);
    const body = cleanText(req.body?.body);
    if (!id) return fail(res, 400, 'Invalid answer id.');
    if (!body) return fail(res, 400, 'Answer cannot be empty.', 'ValidationError');
    if (body.length > BODY_MAX) return fail(res, 400, `Answer is too long (max ${BODY_MAX} characters).`, 'ValidationError');

    try {
        const answer = await prisma.doubtAnswer.findUnique({ where: { id } });
        if (!answer) return fail(res, 404, 'Answer not found.', 'NotFound');
        if (answer.authorId !== req.user.id && !isDoubtAdmin(req.user)) {
            return fail(res, 403, 'You can only edit your own answer.');
        }
        const updated = await prisma.doubtAnswer.update({ where: { id }, data: { body } });
        return res.status(200).json({ success: true, message: 'Answer updated.', data: updated });
    } catch (err) {
        return serverError(res, err);
    }
};

export const deleteAnswer = async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, 'Invalid answer id.');

    try {
        const answer = await prisma.doubtAnswer.findUnique({ where: { id } });
        if (!answer) return fail(res, 404, 'Answer not found.', 'NotFound');
        if (answer.authorId !== req.user.id && !isDoubtAdmin(req.user)) {
            return fail(res, 403, 'You can only delete your own answer.');
        }

        await prisma.$transaction(async (tx) => {
            await tx.doubtAnswer.delete({ where: { id } });
            // If the accepted answer is removed, the doubt is open again.
            if (answer.isAccepted) {
                await tx.doubt.update({ where: { id: answer.doubtId }, data: { status: 'OPEN' } });
            }
        });
        return res.status(200).json({ success: true, message: 'Answer deleted.' });
    } catch (err) {
        return serverError(res, err);
    }
};

// The person who asked (or a moderator) accepts an answer. Accepting marks the
// doubt RESOLVED; accepting the same answer again undoes it.
export const toggleAcceptAnswer = async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, 'Invalid answer id.');

    try {
        const answer = await prisma.doubtAnswer.findUnique({ where: { id }, include: { doubt: true } });
        if (!answer || answer.isHidden) return fail(res, 404, 'Answer not found.', 'NotFound');
        if (answer.doubt.authorId !== req.user.id && !isDoubtAdmin(req.user)) {
            return fail(res, 403, 'Only the person who asked can accept an answer.');
        }

        const accept = !answer.isAccepted;
        await prisma.$transaction(async (tx) => {
            await tx.doubtAnswer.updateMany({ where: { doubtId: answer.doubtId }, data: { isAccepted: false } });
            if (accept) await tx.doubtAnswer.update({ where: { id }, data: { isAccepted: true } });
            await tx.doubt.update({
                where: { id: answer.doubtId },
                data: { status: accept ? 'RESOLVED' : 'OPEN' },
            });
        });

        return res.status(200).json({
            success: true,
            message: accept ? 'Answer accepted. Doubt marked as resolved.' : 'Answer un-accepted.',
            data: { isAccepted: accept, status: accept ? 'RESOLVED' : 'OPEN' },
        });
    } catch (err) {
        return serverError(res, err);
    }
};

// -------------------------------- Votes ------------------------------------

const toggleVote = async (res, userId, target) => {
    const existing = await prisma.doubtVote.findFirst({ where: { userId, ...target } });
    if (existing) {
        await prisma.doubtVote.delete({ where: { id: existing.id } });
    } else {
        try {
            await prisma.doubtVote.create({ data: { userId, ...target } });
        } catch (err) {
            // P2002 = the same vote was created by a parallel request; treat as voted.
            if (err?.code !== 'P2002') throw err;
        }
    }
    const voteCount = await prisma.doubtVote.count({ where: target });
    return res.status(200).json({
        success: true,
        message: existing ? 'Upvote removed.' : 'Upvoted.',
        data: { hasVoted: !existing, voteCount },
    });
};

export const toggleDoubtVote = async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, 'Invalid doubt id.');
    try {
        const doubt = await prisma.doubt.findUnique({ where: { id } });
        if (!doubt || doubt.isHidden) return fail(res, 404, 'Doubt not found.', 'NotFound');
        return await toggleVote(res, req.user.id, { doubtId: id });
    } catch (err) {
        return serverError(res, err);
    }
};

export const toggleAnswerVote = async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, 'Invalid answer id.');
    try {
        const answer = await prisma.doubtAnswer.findUnique({ where: { id } });
        if (!answer || answer.isHidden) return fail(res, 404, 'Answer not found.', 'NotFound');
        return await toggleVote(res, req.user.id, { answerId: id });
    } catch (err) {
        return serverError(res, err);
    }
};

// ------------------------------- Reports -----------------------------------

export const reportContent = async (req, res) => {
    const doubtId = parseId(req.body?.doubtId);
    const answerId = parseId(req.body?.answerId);
    const reason = cleanText(req.body?.reason);

    if ((doubtId ? 1 : 0) + (answerId ? 1 : 0) !== 1) {
        return fail(res, 400, 'Report exactly one doubt or one answer.');
    }
    if (reason.length < 5 || reason.length > REASON_MAX) {
        return fail(res, 400, `Please give a short reason (5 to ${REASON_MAX} characters).`, 'ValidationError');
    }

    try {
        const target = doubtId
            ? await prisma.doubt.findUnique({ where: { id: doubtId } })
            : await prisma.doubtAnswer.findUnique({ where: { id: answerId } });
        if (!target) return fail(res, 404, 'The post you are reporting no longer exists.', 'NotFound');

        const where = { reporterId: req.user.id, status: 'PENDING', ...(doubtId ? { doubtId } : { answerId }) };
        const already = await prisma.doubtReport.findFirst({ where });
        if (already) {
            return res.status(200).json({ success: true, message: 'You have already reported this. Moderators will review it.' });
        }

        await prisma.doubtReport.create({
            data: { reason, reporterId: req.user.id, ...(doubtId ? { doubtId } : { answerId }) },
        });
        return res.status(201).json({ success: true, message: 'Reported. Moderators will review it.' });
    } catch (err) {
        return serverError(res, err);
    }
};

// ------------------------------ Moderation ---------------------------------
// Everything below is mounted behind checkDoubtAdmin.

export const getAdminStats = async (req, res) => {
    try {
        const [total, open, resolved, hidden, unanswered, pendingReports] = await Promise.all([
            prisma.doubt.count(),
            prisma.doubt.count({ where: { status: 'OPEN', isHidden: false } }),
            prisma.doubt.count({ where: { status: 'RESOLVED', isHidden: false } }),
            prisma.doubt.count({ where: { isHidden: true } }),
            prisma.doubt.count({ where: { isHidden: false, answers: { none: { isHidden: false } } } }),
            prisma.doubtReport.count({ where: { status: 'PENDING' } }),
        ]);
        return res.status(200).json({
            success: true,
            data: { total, open, resolved, hidden, unanswered, pendingReports },
        });
    } catch (err) {
        return serverError(res, err);
    }
};

export const getReports = async (req, res) => {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
    const status = ['PENDING', 'ACTIONED', 'DISMISSED'].includes(req.query.status) ? req.query.status : 'PENDING';

    try {
        const [rows, total] = await Promise.all([
            prisma.doubtReport.findMany({
                where: { status },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    reporter: { select: authorSelect },
                    doubt: {
                        select: { id: true, title: true, body: true, isHidden: true, author: { select: authorSelect } },
                    },
                    answer: {
                        select: {
                            id: true,
                            body: true,
                            isHidden: true,
                            author: { select: authorSelect },
                            doubt: { select: { id: true, title: true } },
                        },
                    },
                },
            }),
            prisma.doubtReport.count({ where: { status } }),
        ]);

        const data = rows.map(({ doubt, answer, ...report }) => ({
            ...report,
            targetType: doubt ? 'DOUBT' : 'ANSWER',
            threadId: doubt ? doubt.id : answer?.doubt?.id,
            threadTitle: doubt ? doubt.title : answer?.doubt?.title,
            targetId: doubt ? doubt.id : answer?.id,
            targetAuthor: doubt ? doubt.author : answer?.author,
            targetHidden: doubt ? doubt.isHidden : answer?.isHidden,
            targetExcerpt: makeExcerpt(doubt ? doubt.body : answer?.body, 280),
        }));

        return res.status(200).json({
            success: true,
            data,
            pagination: { total, page, limit, totalPages: Math.max(Math.ceil(total / limit), 1) },
        });
    } catch (err) {
        return serverError(res, err);
    }
};

// Close a report. With hideContent=true the reported post is hidden as well
// and every other pending report on that post is closed with it.
export const resolveReport = async (req, res) => {
    const id = parseId(req.params.id);
    const status = req.body?.status;
    const hideContent = req.body?.hideContent === true;
    if (!id) return fail(res, 400, 'Invalid report id.');
    if (status !== 'ACTIONED' && status !== 'DISMISSED') {
        return fail(res, 400, 'Status must be ACTIONED or DISMISSED.');
    }

    try {
        const report = await prisma.doubtReport.findUnique({ where: { id } });
        if (!report) return fail(res, 404, 'Report not found.', 'NotFound');

        await prisma.$transaction(async (tx) => {
            if (status === 'ACTIONED' && hideContent) {
                if (report.doubtId) {
                    await tx.doubt.update({ where: { id: report.doubtId }, data: { isHidden: true } });
                    await tx.doubtReport.updateMany({
                        where: { doubtId: report.doubtId, status: 'PENDING' },
                        data: { status: 'ACTIONED' },
                    });
                } else if (report.answerId) {
                    await unacceptIfNeeded(tx, report.answerId);
                    await tx.doubtAnswer.update({ where: { id: report.answerId }, data: { isHidden: true } });
                    await tx.doubtReport.updateMany({
                        where: { answerId: report.answerId, status: 'PENDING' },
                        data: { status: 'ACTIONED' },
                    });
                }
            }
            await tx.doubtReport.update({ where: { id }, data: { status } });
        });

        return res.status(200).json({
            success: true,
            message: status === 'DISMISSED' ? 'Report dismissed.' : 'Report closed.',
        });
    } catch (err) {
        return serverError(res, err);
    }
};

// A hidden answer cannot stay the accepted one.
const unacceptIfNeeded = async (tx, answerId) => {
    const answer = await tx.doubtAnswer.findUnique({ where: { id: answerId } });
    if (answer?.isAccepted) {
        await tx.doubtAnswer.update({ where: { id: answerId }, data: { isAccepted: false } });
        await tx.doubt.update({ where: { id: answer.doubtId }, data: { status: 'OPEN' } });
    }
};

// Pin / lock / hide a thread.
export const moderateDoubt = async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, 'Invalid doubt id.');

    const data = {};
    for (const key of ['isPinned', 'isLocked', 'isHidden']) {
        if (typeof req.body?.[key] === 'boolean') data[key] = req.body[key];
    }
    if (Object.keys(data).length === 0) return fail(res, 400, 'Nothing to update.');

    try {
        const doubt = await prisma.doubt.findUnique({ where: { id } });
        if (!doubt) return fail(res, 404, 'Doubt not found.', 'NotFound');
        const updated = await prisma.doubt.update({ where: { id }, data });
        return res.status(200).json({
            success: true,
            message: 'Discussion updated.',
            data: { isPinned: updated.isPinned, isLocked: updated.isLocked, isHidden: updated.isHidden },
        });
    } catch (err) {
        return serverError(res, err);
    }
};

// Hide / unhide a single answer.
export const moderateAnswer = async (req, res) => {
    const id = parseId(req.params.id);
    const isHidden = req.body?.isHidden;
    if (!id) return fail(res, 400, 'Invalid answer id.');
    if (typeof isHidden !== 'boolean') return fail(res, 400, 'isHidden must be true or false.');

    try {
        const answer = await prisma.doubtAnswer.findUnique({ where: { id } });
        if (!answer) return fail(res, 404, 'Answer not found.', 'NotFound');

        await prisma.$transaction(async (tx) => {
            if (isHidden) await unacceptIfNeeded(tx, id);
            await tx.doubtAnswer.update({ where: { id }, data: { isHidden } });
        });
        return res.status(200).json({
            success: true,
            message: isHidden ? 'Answer hidden.' : 'Answer is visible again.',
            data: { isHidden },
        });
    } catch (err) {
        return serverError(res, err);
    }
};
