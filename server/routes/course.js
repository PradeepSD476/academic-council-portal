import express from 'express';
import { getMyCourses, addCourse } from "../controllers/courseController.js";
import { checkAdmin } from '../middlewares/checkAdmin.js';

const router = express.Router();

router.get('/myCourses', getMyCourses);
router.post('/addCourse', checkAdmin, addCourse);

export default router