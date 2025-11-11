// routes/reviews.js

import express from 'express';
import { verifyAuth } from '../middleware/auth.js'; 
import {
    handleCreateReview,
    handleGetCourseReviews,
    handleDeleteReview,
} from '../controllers/reviews.js'; // Imports handlers from controller

const router = express.Router();

// Reviews Routes
// POST and DELETE are protected
router.post('/', verifyAuth, handleCreateReview);
router.delete('/:reviewId', verifyAuth, handleDeleteReview);
// GET is public
router.get('/:courseId', handleGetCourseReviews); 

export default router;