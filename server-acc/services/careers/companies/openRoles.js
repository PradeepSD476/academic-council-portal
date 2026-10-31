// Adds `openRoles` (LIVE postings of the experience's company) to Career Vault experiences, for the
// "N open roles at X" chip (P3-T3). One grouped query for the whole page, never one per post.
// While Jobs & Internships is hidden from students, a student gets neither the company link nor the
// counts (B-12); career admins always do, like every other careers route.
import prisma from '../../../config/db.js';
import { getSetting } from '../settings.js';
import { isCareerAdmin } from '../../../middlewares/careers/requireCareerAdmin.js';

// posts: experiences that include `company: { id, name, slug } | null`; user: req.user. Returns new objects.
export async function withOpenRoles(posts, { user = null, db = prisma } = {}) {
    if (!isCareerAdmin(user) && !(await getSetting('careers.visibleToStudents'))) {
        return posts.map((p) => ({ ...p, company: null, openRoles: 0 }));
    }
    const companyIds = [...new Set(posts.map((p) => p.company?.id).filter(Boolean))];
    if (!companyIds.length) return posts.map((p) => ({ ...p, openRoles: 0 }));
    const groups = await db.posting.groupBy({
        by: ['companyId'],
        where: { companyId: { in: companyIds }, status: 'LIVE' },
        _count: { _all: true },
    });
    const counts = new Map(groups.map((g) => [g.companyId, g._count._all]));
    return posts.map((p) => ({ ...p, openRoles: p.company ? counts.get(p.company.id) ?? 0 : 0 }));
}
