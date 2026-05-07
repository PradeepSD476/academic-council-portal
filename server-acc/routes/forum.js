import express from 'express';
import { checkAnnouncementAdmin } from '../middlewares/checkAnnouncementAdmin.js';
import { checkAuth } from '../middlewares/checkAuth.js';
import { addComment, addpost, deleteComment, deletePost, editPost, getAllPosts, getComments, togglePostLike } from '../controllers/ForumController.js';

const router = express.Router();

// Admin: create/edit/delete posts (requires admin role)
router.post('/posts', checkAuth, checkAnnouncementAdmin, addpost);
router.patch('/posts/:id', checkAuth, checkAnnouncementAdmin, editPost);
router.delete('/posts/:id', checkAuth, checkAnnouncementAdmin, deletePost);



// Public: only PUBLISHED posts shown on homepage / career vault
router.get('/posts', checkAuth, getAllPosts);

// Comments & likes
router.delete('/posts/comments/:id', checkAuth, deleteComment);
router.post('/posts/comments', checkAuth, addComment);
router.get('/posts/:id/comments', checkAuth, getComments);
router.post('/posts/toggle-like/:id', checkAuth, togglePostLike);

export default router;