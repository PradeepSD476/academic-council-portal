import express from 'express';
import { getMyCourses, addCourse, editCourse, deleteCourse, getAllCourses, getCourse } from "../controllers/courseController.js";
import { checkResourceAdmin } from '../middlewares/checkResourceAdmin.js';
import { checkAuth } from '../middlewares/checkAuth.js';

const router = express.Router();

router.get('/courses/my', checkAuth, getMyCourses);
router.get('/courses', checkAuth, checkResourceAdmin, getAllCourses);
router.get('/courses/:id', checkAuth, getCourse)
router.post('/courses', checkAuth, checkResourceAdmin, addCourse);
router.patch('/courses/:id', checkAuth, checkResourceAdmin, editCourse);
router.delete('/courses/:id', checkAuth, checkResourceAdmin, deleteCourse);

export default router