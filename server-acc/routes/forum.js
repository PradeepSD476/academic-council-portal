import express from 'express';
import { checkAnnouncementAdmin } from '../middlewares/checkAnnouncementAdmin.js';
import { checkAuth } from '../middlewares/checkAuth.js';
import { addComment, addpost, deleteComment, deletePost, editPost, getAllPosts, getMyPosts } from '../controllers/ForumController.js';

const router = express.Router();

router.post('/posts', checkAuth, checkAnnouncementAdmin, addpost);
router.patch('/posts/:id', checkAuth, checkAnnouncementAdmin, editPost);
router.get('/posts', checkAuth, getAllPosts);
router.delete('/posts/:id', checkAuth, checkAnnouncementAdmin, deletePost);
router.delete('/posts/comments/:id', checkAuth, checkAnnouncementAdmin, deleteComment);
router.post('/posts/comments', checkAuth, checkAnnouncementAdmin, addComment);
router.get('/posts/my', checkAuth, getMyPosts);

export default router;