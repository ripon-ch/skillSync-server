// routes/enrollments.js

import express from 'express';
import { verifyAuth } from '../middleware/auth.js'; // To ensure the routes are protected
import {
    handleEnroll,
    handleCheckEnrollment,
    handleGetMyEnrollments,
} from '../controllers/enrollments.js';

const router = express.Router();

// All enrollment operations require authentication
router.post('/', verifyAuth, handleEnroll);
router.get('/check/:courseId', verifyAuth, handleCheckEnrollment);
router.get('/user/my-enrollments', verifyAuth, handleGetMyEnrollments);

export default router;