import express from 'express';
import { getMyCourses, addCourse, editCourse, deleteCourse, getAllCourses } from "../controllers/courseController.js";
import { checkResourceAdmin } from '../middlewares/checkResourceAdmin.js';

const router = express.Router();

router.get('/courses/my', getMyCourses);
router.get('/courses', checkResourceAdmin, getAllCourses);
router.post('/courses', checkResourceAdmin, addCourse);
router.patch('/courses/:id', checkResourceAdmin, editCourse);
router.delete('/courses/:id', checkResourceAdmin, deleteCourse);

export default router