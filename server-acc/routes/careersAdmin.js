import express from 'express';
import { checkAuth } from '../middlewares/checkAuth.js';
import { requireCareerAdmin } from '../middlewares/careers/requireCareerAdmin.js';
import { getSettings, updateSettings } from '../controllers/careers/adminSettingsController.js';
import {
    listCompanies, getCompany, createCompany, updateCompany, addAlias, deleteAlias, approveCandidate,
} from '../controllers/careers/adminCompaniesController.js';
import { merge, split, listMergeLog, undo } from '../controllers/careers/adminMergeController.js';

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

export default router;
