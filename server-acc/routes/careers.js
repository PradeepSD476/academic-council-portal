import express from 'express';
import { checkAuth } from '../middlewares/checkAuth.js';
import { getCareersStatus } from '../controllers/careers/statusController.js';
import { requireCareersEnabled } from '../middlewares/careers/requireCareersEnabled.js';
import { submissionRateLimit } from '../middlewares/careers/submissionRateLimit.js';
import { submitLink, mySubmissions, withdrawLink } from '../controllers/careers/submissionsController.js';
import { getMyEligibility, updateMyCpi, updateMyProgramme } from '../controllers/careers/eligibilityController.js';
import { listPostings, newPostingsCount, getPosting, reportPosting, applyClick } from '../controllers/careers/postingsController.js';
import { searchCompanies, listCompanies, getCompanyPage } from '../controllers/careers/companiesController.js';
import { listAlerts, createAlert, updateAlert, deleteAlert, unsubscribeAlert, resubscribeAlert } from '../controllers/careers/alertsController.js';
import { savePosting, unsavePosting, hidePosting, unhidePosting, setApplication, setApplicationNote, listSaved } from '../controllers/careers/trackingController.js';

// Student-facing careers routes. requireCareersEnabled is applied per route (not router-wide)
// because /careers/status and /careers/companies/search must answer even while the feature is hidden.
const router = express.Router();

router.get('/careers/status', checkAuth, getCareersStatus);
// The company picker works while the feature is hidden (no flag gate).
router.get('/careers/companies/search', checkAuth, searchCompanies);
router.get('/careers/companies', checkAuth, requireCareersEnabled, listCompanies);
router.get('/careers/companies/:slug', checkAuth, requireCareersEnabled, getCompanyPage); // after /search

router.get('/careers/postings', checkAuth, requireCareersEnabled, listPostings);
router.get('/careers/postings/new-count', checkAuth, requireCareersEnabled, newPostingsCount); // before /:id
router.get('/careers/postings/:id', checkAuth, requireCareersEnabled, getPosting);
router.post('/careers/postings/:id/report', checkAuth, requireCareersEnabled, reportPosting);
router.post('/careers/postings/:id/apply-click', checkAuth, requireCareersEnabled, applyClick); // counts only (P7-T4) // one per student and posting (unique)

router.post('/careers/submissions', checkAuth, requireCareersEnabled, submissionRateLimit, submitLink);
router.get('/careers/submissions/mine', checkAuth, requireCareersEnabled, mySubmissions);
router.post('/careers/submissions/:id/withdraw', checkAuth, requireCareersEnabled, withdrawLink);

router.put('/careers/postings/:id/save', checkAuth, requireCareersEnabled, savePosting);
router.delete('/careers/postings/:id/save', checkAuth, requireCareersEnabled, unsavePosting);
router.put('/careers/postings/:id/hide', checkAuth, requireCareersEnabled, hidePosting);
router.delete('/careers/postings/:id/hide', checkAuth, requireCareersEnabled, unhidePosting);
router.put('/careers/postings/:id/application', checkAuth, requireCareersEnabled, setApplication);
router.put('/careers/postings/:id/application/note', checkAuth, requireCareersEnabled, setApplicationNote);
router.get('/careers/saved', checkAuth, requireCareersEnabled, listSaved);

router.get('/careers/alerts', checkAuth, requireCareersEnabled, listAlerts);
router.post('/careers/alerts', checkAuth, requireCareersEnabled, createAlert);
router.patch('/careers/alerts/:id', checkAuth, requireCareersEnabled, updateAlert);
router.delete('/careers/alerts/:id', checkAuth, requireCareersEnabled, deleteAlert);
// The link in the digest email: no login and no flag gate (stopping emails must always work).
router.post('/careers/alerts/unsubscribe', unsubscribeAlert);
router.post('/careers/alerts/resubscribe', resubscribeAlert);

router.get('/careers/me/eligibility', checkAuth, requireCareersEnabled, getMyEligibility);
router.patch('/careers/me/cpi', checkAuth, requireCareersEnabled, updateMyCpi);
router.patch('/careers/me/programme', checkAuth, requireCareersEnabled, updateMyProgramme);

export default router;
