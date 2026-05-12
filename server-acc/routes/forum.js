import express from 'express';
import { checkAnnouncementAdmin } from '../middlewares/checkAnnouncementAdmin.js';
import { checkAuth } from '../middlewares/checkAuth.js';
import { addComment, addpost, deleteComment, deletePost, editPost, getAllPosts, getComments, togglePostLike } from '../controllers/ForumController.js';
import { orMiddleware } from '../middlewares/Combinators/orMiddleware.js';
import { checkCareerAdmin } from '../middlewares/checkCareerAdmin.js';
import { addPostEligibility } from '../middlewares/Forum/addPost.js';
import { checkPostOwnership } from '../middlewares/Forum/postOwnership.js';
import { checkCommentOwnership } from '../middlewares/Forum/commentOwnership.js';

const router = express.Router();

// Admin: create/edit/delete posts (requires admin role)
router.post('/posts', checkAuth, orMiddleware(checkCareerAdmin, addPostEligibility), addpost);
router.patch('/posts/:id', checkAuth, orMiddleware(checkCareerAdmin, checkPostOwnership), editPost);
router.delete('/posts/:id', checkAuth, orMiddleware(checkCareerAdmin, checkPostOwnership), deletePost);



// Public: only PUBLISHED posts shown on homepage / career vault
router.get('/posts', checkAuth, getAllPosts);

// Comments & likes
router.delete('/posts/comments/:id', checkAuth, orMiddleware(checkCareerAdmin, checkCommentOwnership), deleteComment);
router.post('/posts/comments', checkAuth, addComment);
router.get('/posts/:id/comments', checkAuth, getComments);
router.post('/posts/toggle-like/:id', checkAuth, togglePostLike);

export default router;