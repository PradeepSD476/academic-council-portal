import express from 'express';
import {
  getOpenPositions,
  getOpenPositionById,
  createOpenPosition,
  updateOpenPosition,
  deleteOpenPosition,
  bookmarkPosition,
  unbookmarkPosition,
  toggleBookmarkPosition,
  getResearchPositionBookmarks,
} from '../../controllers/researchVault/positionController.js';
import { checkAuth } from '../../middlewares/checkAuth.js';
import { optionalAuth } from '../../middlewares/optionalAuth.js';
import { checkResearchAdmin } from '../../middlewares/checkResearchAdmin.js';

const router = express.Router();

// Specific routes before param :id routes
router.get('/bookmarks', checkAuth, getResearchPositionBookmarks);
router.post('/bookmarks', checkAuth, bookmarkPosition);
router.delete('/bookmarks/:id', checkAuth, unbookmarkPosition);

router.get('/', optionalAuth, getOpenPositions);
router.get('/:id', optionalAuth, getOpenPositionById);
router.post('/:id/bookmark', checkAuth, toggleBookmarkPosition);
router.post('/', checkAuth, checkResearchAdmin, createOpenPosition);
router.put('/:id', checkAuth, checkResearchAdmin, updateOpenPosition);
router.delete('/:id', checkAuth, checkResearchAdmin, deleteOpenPosition);

export default router;
