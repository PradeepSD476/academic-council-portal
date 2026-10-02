import express from 'express';
import { checkAuth } from '../middlewares/checkAuth.js';
import { getCareersStatus } from '../controllers/careers/statusController.js';
import { requireCareersEnabled } from '../middlewares/careers/requireCareersEnabled.js';
import { submissionRateLimit } from '../middlewares/careers/submissionRateLimit.js';
import { submitLink, mySubmissions } from '../controllers/careers/submissionsController.js';
import { getMyEligibility, updateMyCpi } from '../controllers/careers/eligibilityController.js';
import { listPostings, getPosting } from '../controllers/careers/postingsController.js';
import { searchCompanies, listCompanies, getCompanyPage } from '../controllers/careers/companiesController.js';
import { savePosting, unsavePosting, setApplication, listSaved } from '../controllers/careers/trackingController.js';

// Student-facing careers routes. requireCareersEnabled is applied per route (not router-wide)
// because /careers/status and /careers/companies/search must answer even while the feature is hidden.
const router = express.Router();

router.get('/careers/status', checkAuth, getCareersStatus);
// The company picker works while the feature is hidden (no flag gate).
router.get('/careers/companies/search', checkAuth, searchCompanies);
router.get('/careers/companies', checkAuth, requireCareersEnabled, listCompanies);
router.get('/careers/companies/:slug', checkAuth, requireCareersEnabled, getCompanyPage); // after /search

router.get('/careers/postings', checkAuth, requireCareersEnabled, listPostings);
router.get('/careers/postings/:id', checkAuth, requireCareersEnabled, getPosting);

router.post('/careers/submissions', checkAuth, requireCareersEnabled, submissionRateLimit, submitLink);
router.get('/careers/submissions/mine', checkAuth, requireCareersEnabled, mySubmissions);

router.put('/careers/postings/:id/save', checkAuth, requireCareersEnabled, savePosting);
router.delete('/careers/postings/:id/save', checkAuth, requireCareersEnabled, unsavePosting);
router.put('/careers/postings/:id/application', checkAuth, requireCareersEnabled, setApplication);
router.get('/careers/saved', checkAuth, requireCareersEnabled, listSaved);

router.get('/careers/me/eligibility', checkAuth, requireCareersEnabled, getMyEligibility);
router.patch('/careers/me/cpi', checkAuth, requireCareersEnabled, updateMyCpi);

export default router;
