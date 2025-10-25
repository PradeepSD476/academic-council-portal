import express from 'express';
import { getMyCourses } from "../controllers/courseController.js";

const router = express.Router();

router.get('/my-courses', getMyCourses);

export default router