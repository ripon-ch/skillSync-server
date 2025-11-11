// controllers/reviews.js

import { ObjectId } from 'mongodb';
// Ensure 'isDBConnected' is imported for robust error handling
import { getDB, isDBConnected } from '../index.js'; 

const REVIEWS_COLLECTION = 'reviews';
const ENROLLMENTS_COLLECTION = 'enrollments';

/**
 * Handles creating a new course review.
 * Protected route (requires verifyAuth). User must be enrolled.
 */
export async function handleCreateReview(req, res) {
    // ⚠️ CRITICAL SECURITY FIX: Get user details from the JWT payload
    const userId = req.user.id;
    const userName = req.user.name;
    const userEmail = req.user.email;
    
    const { courseId, rating, comment } = req.body; // Using 'comment' for review text

    // 1. Basic Validation
    if (!courseId || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Invalid review data (Missing fields or invalid rating)' });
    }

    if (!isDBConnected() || !ObjectId.isValid(courseId) || !ObjectId.isValid(userId)) {
        return res.status(500).json({ error: 'Database connection failed or ID is invalid.' });
    }

    try {
        const db = getDB();
        const reviewsCollection = db.collection(REVIEWS_COLLECTION);
        const enrollmentsCollection = db.collection(ENROLLMENTS_COLLECTION);
        
        const courseObjectId = new ObjectId(courseId);
        const userObjectId = new ObjectId(userId);

        // 2. CRITICAL CHECK: User must be ENROLLED in the course
        const isEnrolled = await enrollmentsCollection.findOne({
            courseId: courseObjectId,
            userId: userObjectId, // Check by ID or email (ID is better)
        });

        if (!isEnrolled) {
            return res.status(403).json({ message: 'Forbidden. You must be enrolled to review this course.' });
        }

        // 3. Prevent Duplicate Reviews
        const existingReview = await reviewsCollection.findOne({
            courseId: courseObjectId,
            userId: userObjectId,
        });

        if (existingReview) {
            return res.status(409).json({ message: 'You have already reviewed this course.' });
        }

        // 4. Create and Insert Review
        const newReview = {
            courseId: courseObjectId,
            userId: userObjectId, // Store as ObjectId
            userName: userName,
            userEmail: userEmail,
            rating: parseInt(rating),
            comment: comment || '',
            createdAt: new Date(),
        };

        const result = await reviewsCollection.insertOne(newReview);
        res.status(201).json({ success: true, _id: result.insertedId, ...newReview });

    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({ error: 'Failed to create review' });
    }
}

/**
 * Handles fetching all reviews for a specific course. Public route.
 */
export async function handleGetCourseReviews(req, res) {
    // This logic is mostly correct and does not require req.user
    // ... (Use your existing logic for handleGetCourseReviews, ensuring getDB/isDBConnected is imported)
    try {
        const db = getDB();
        const { courseId } = req.params;
    
        if (!db || !ObjectId.isValid(courseId)) {
          return res.json({
            reviews: [],
            averageRating: 0,
            totalReviews: 0,
            distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
          });
        }
    
        const reviewsCollection = db.collection(REVIEWS_COLLECTION);
        const courseObjectId = new ObjectId(courseId);
    
        const reviews = await reviewsCollection
          .find({ courseId: courseObjectId })
          .sort({ createdAt: -1 })
          .toArray();
    
        // Calculate statistics using aggregation
        const stats = await reviewsCollection
          .aggregate([
            { $match: { courseId: courseObjectId } },
            {
              $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 },
                ratingDistribution: {
                  $push: '$rating'
                }
              }
            }
          ])
          .toArray();
    
        let averageRating = 0;
        let totalReviews = 0;
        let distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    
        if (stats.length > 0) {
          const stat = stats[0];
          averageRating = parseFloat(stat.averageRating.toFixed(1));
          totalReviews = stat.totalReviews;
    
          stat.ratingDistribution.forEach(rating => {
            distribution[rating]++;
          });
        }
    
        res.json({
          reviews,
          averageRating,
          totalReviews,
          distribution
        });
      } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
      }
}

/**
 * Handles deleting a specific review.
 * Protected route (requires verifyAuth). User must own the review or be an Admin.
 */
export async function handleDeleteReview(req, res) {
    // ⚠️ CRITICAL SECURITY FIX: Get user details from the JWT payload
    const currentUserId = req.user.id;
    const userRole = req.user.role;
    const { reviewId } = req.params;

    if (!isDBConnected() || !ObjectId.isValid(reviewId) || !ObjectId.isValid(currentUserId)) {
        return res.status(500).json({ error: 'Failed to connect or ID is invalid.' });
    }

    try {
        const db = getDB();
        const reviewsCollection = db.collection(REVIEWS_COLLECTION);
        
        const reviewObjectId = new ObjectId(reviewId);
        
        // 1. Find the review to check ownership
        const review = await reviewsCollection.findOne({ _id: reviewObjectId });

        if (!review) {
            return res.status(404).json({ error: 'Review not found.' });
        }
        
        // 2. Authorization Check: Must be the owner or an admin
        // Note: MongoDB stores IDs as ObjectId objects, so comparison requires .toString()
        const isOwner = review.userId.toString() === currentUserId.toString();
        const isAdmin = userRole === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: 'Forbidden. You do not have permission to delete this review.' });
        }

        // 3. Delete the Review
        const result = await reviewsCollection.deleteOne({ _id: reviewObjectId });

        if (result.deletedCount === 0) {
            // Should be caught by the earlier findOne, but good practice
            return res.status(404).json({ error: 'Review not found.' }); 
        }

        res.json({ success: true, message: 'Review deleted successfully.' });

    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({ error: 'Failed to delete review' });
    }
}