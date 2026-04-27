import express from 'express';
import { checkAnnouncementAdmin } from '../middlewares/checkAnnouncementAdmin.js';
import { checkAuth } from '../middlewares/checkAuth.js';
import { addComment, addpost, deleteComment, deletePost, editPost, getAllPosts, getComments, togglePostLike } from '../controllers/ForumController.js';

const router = express.Router();

router.post('/posts', checkAuth, checkAnnouncementAdmin, addpost);
router.patch('/posts/:id', checkAuth, checkAnnouncementAdmin, editPost);
router.get('/posts', checkAuth, getAllPosts);
router.delete('/posts/:id', checkAuth, checkAnnouncementAdmin, deletePost);
router.delete('/posts/comments/:id', checkAuth, deleteComment);
router.post('/posts/comments', checkAuth, addComment);
router.get('/posts/:id/comments', checkAuth, getComments);
// router.get('/posts/my', checkAuth, getMyPosts);
router.post('/posts/toggle-like/:id', checkAuth, togglePostLike)

export default router;