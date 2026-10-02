import express from 'express';
import { checkAuth } from '../middlewares/checkAuth.js';
import { requireCareerAdmin } from '../middlewares/careers/requireCareerAdmin.js';
import { getSettings, updateSettings } from '../controllers/careers/adminSettingsController.js';
import {
    listCompanies, getCompany, createCompany, updateCompany, addAlias, deleteAlias, approveCandidate,
} from '../controllers/careers/adminCompaniesController.js';
import { merge, split, listMergeLog, undo } from '../controllers/careers/adminMergeController.js';
import {
    listReview, getPosting, patchPosting, approve, reject, expire, reopen, bulk, createManual, listSubmissions,
} from '../controllers/careers/adminReviewController.js';
import {
    listSources, createSource, updateSource, runSourceNow, runAllNow, listRuns,
} from '../controllers/careers/adminSourcesController.js';
import { getOps } from '../controllers/careers/adminOpsController.js';
import { listBackfill, applyBackfill, unlinkBackfill } from '../controllers/careers/adminBackfillController.js';

const router = express.Router();
const admin = [checkAuth, requireCareerAdmin];

router.get('/careers/admin/settings', ...admin, getSettings);
router.put('/careers/admin/settings', ...admin, updateSettings);

// Static paths before /:id paths.
router.post('/careers/admin/companies/merge', ...admin, merge);
router.get('/careers/admin/companies', ...admin, listCompanies);
router.post('/careers/admin/companies', ...admin, createCompany);
router.get('/careers/admin/companies/:id', ...admin, getCompany);
router.patch('/careers/admin/companies/:id', ...admin, updateCompany);
router.post('/careers/admin/companies/:id/aliases', ...admin, addAlias);
router.post('/careers/admin/companies/:id/approve', ...admin, approveCandidate);
router.post('/careers/admin/companies/:id/split', ...admin, split);
router.delete('/careers/admin/aliases/:aliasId', ...admin, deleteAlias);

router.get('/careers/admin/merge-log', ...admin, listMergeLog);
router.post('/careers/admin/merge-log/:id/undo', ...admin, undo);

// Review queue and postings (static paths before /:id).
router.get('/careers/admin/review', ...admin, listReview);
router.post('/careers/admin/postings/bulk-approve', ...admin, bulk);
router.post('/careers/admin/postings', ...admin, createManual);
router.get('/careers/admin/postings/:id', ...admin, getPosting);
router.patch('/careers/admin/postings/:id', ...admin, patchPosting);
router.post('/careers/admin/postings/:id/approve', ...admin, approve);
router.post('/careers/admin/postings/:id/reject', ...admin, reject);
router.post('/careers/admin/postings/:id/expire', ...admin, expire);
router.post('/careers/admin/postings/:id/reopen', ...admin, reopen);
router.get('/careers/admin/submissions', ...admin, listSubmissions);

// Sources and operations.
router.post('/careers/admin/sources/run-all', ...admin, runAllNow);
router.get('/careers/admin/sources', ...admin, listSources);
router.post('/careers/admin/sources', ...admin, createSource);
router.patch('/careers/admin/sources/:id', ...admin, updateSource);
router.post('/careers/admin/sources/:id/run', ...admin, runSourceNow);
router.get('/careers/admin/sources/:id/runs', ...admin, listRuns);
router.get('/careers/admin/ops', ...admin, getOps);

// Experience backfill (link old Career Vault experiences to companies).
router.get('/careers/admin/backfill/suggestions', ...admin, listBackfill);
router.post('/careers/admin/backfill/apply', ...admin, applyBackfill);
router.post('/careers/admin/backfill/unlink', ...admin, unlinkBackfill);

export default router;
