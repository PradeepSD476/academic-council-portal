import express from 'express';
import {
  getFacultyProfiles,
  getFacultyProfileById,
  recordFacultyProfileView,
  getFacultyOpenings,
  createFacultyProfile,
  updateFacultyProfile,
  deleteFacultyProfile,
} from '../../controllers/researchVault/facultyController.js';
import { checkAuth } from '../../middlewares/checkAuth.js';
import { optionalAuth } from '../../middlewares/optionalAuth.js';
import { checkResearchAdmin } from '../../middlewares/checkResearchAdmin.js';

const router = express.Router();

router.get('/', getFacultyProfiles);
router.get('/openings/:id', getFacultyOpenings);
router.get('/:id', getFacultyProfileById);
router.post('/:id/view', optionalAuth, recordFacultyProfileView);
router.post('/', checkAuth, checkResearchAdmin, createFacultyProfile);
router.put('/:id', checkAuth, checkResearchAdmin, updateFacultyProfile);
router.delete('/:id', checkAuth, checkResearchAdmin, deleteFacultyProfile);

export default router;
