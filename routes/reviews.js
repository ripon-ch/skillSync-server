import { ObjectId } from 'mongodb';
import { getDB } from '../index.js';

export async function handleCreateReview(req, res) {
  try {
    const db = getDB();
    const { courseId, userId, userName, userEmail, rating, reviewText } = req.body;

    if (!courseId || !userId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Invalid review data' });
    }

    if (!db) {
      return res.json({
        success: true,
        message: 'Review saved locally',
        review: { ...req.body, _id: new ObjectId() }
      });
    }

    const reviewsCollection = db.collection('reviews');

    // Handle both valid ObjectIds and simple string IDs
    let courseObjectId;
    try {
      courseObjectId = ObjectId.isValid(courseId) ? new ObjectId(courseId) : courseId;
    } catch {
      courseObjectId = courseId;
    }

    const review = {
      courseId: courseObjectId,
      userId,
      userName,
      userEmail,
      rating: parseInt(rating),
      reviewText: reviewText || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await reviewsCollection.insertOne(review);
    res.json({ success: true, _id: result.insertedId, ...review });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
}

export async function handleGetCourseReviews(req, res) {
  try {
    const db = getDB();
    const { courseId } = req.params;

    if (!db) {
      return res.json({
        reviews: [],
        averageRating: 0,
        totalReviews: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      });
    }

    const reviewsCollection = db.collection('reviews');

    // Handle both valid ObjectIds and simple string IDs
    let courseObjectId;
    try {
      courseObjectId = ObjectId.isValid(courseId) ? new ObjectId(courseId) : courseId;
    } catch {
      courseObjectId = courseId;
    }

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
        if (distribution[rating] !== undefined) {
          distribution[rating]++;
        }
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

export async function handleDeleteReview(req, res) {
  try {
    const db = getDB();
    const { reviewId } = req.params;
    const { userId } = req.body;

    if (!db) {
      return res.json({ success: true, message: 'Review deleted locally' });
    }

    const reviewsCollection = db.collection('reviews');
    const review = await reviewsCollection.findOne({ _id: new ObjectId(reviewId) });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await reviewsCollection.deleteOne({ _id: new ObjectId(reviewId) });
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
}
