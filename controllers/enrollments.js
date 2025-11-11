// controllers/enrollments.js

import { ObjectId } from 'mongodb';
import { getDB, isDBConnected } from '../index.js';

export async function handleEnroll(req, res) {
    // ⚠️ SECURITY FIX: Use req.user.email (from JWT) instead of req.body.userEmail
    const { courseId } = req.body;
    const userEmail = req.user.email; 
    
    if (!courseId) {
        return res.status(400).json({ error: 'Missing required courseId field' });
    }
    
    // If DB is not connected OR the id is not a valid ObjectId, accept enrollment in mock mode
    if (!isDBConnected() || !ObjectId.isValid(courseId)) {
        return res.status(201).json({
            courseId,
            userEmail,
            _id: Math.random().toString(36).substr(2, 9),
            enrolledAt: new Date(),
        });
    }

    try {
        const db = getDB();
        const enrollmentsCollection = db.collection('enrollments');
        const coursesCollection = db.collection('courses');

        const courseObjectId = new ObjectId(courseId);

        // Check if already enrolled
        const existingEnrollment = await enrollmentsCollection.findOne({
            courseId: courseObjectId,
            userEmail,
        });

        if (existingEnrollment) {
            return res.status(400).json({ error: 'Already enrolled in this course' });
        }

        // Check if course exists
        const course = await coursesCollection.findOne({ _id: courseObjectId });
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        const enrollment = {
            courseId: courseObjectId,
            userEmail,
            userId: new ObjectId(req.user.id), // Store user ID as ObjectId for better indexing/lookups
            enrolledAt: new Date(),
        };

        const result = await enrollmentsCollection.insertOne(enrollment);
        res.status(201).json({ ...enrollment, _id: result.insertedId });
    } catch (error) {
        console.error('Error enrolling:', error.message);
        return res.status(500).json({ error: 'Failed to complete enrollment.' });
    }
}

export async function handleCheckEnrollment(req, res) {
    const { courseId } = req.params;
    // ⚠️ SECURITY FIX: Use req.user.email (from JWT) instead of req.query.email
    const email = req.user.email; 

    // The check for email is no longer needed since req.user is guaranteed by middleware
    // if (!email) { /* ... */ }

    if (!isDBConnected() || !ObjectId.isValid(courseId)) {
        return res.json({ enrolled: false });
    }

    try {
        const db = getDB();
        const collection = db.collection('enrollments');

        const enrollment = await collection.findOne({
            courseId: new ObjectId(courseId),
            userEmail: email,
        });

        res.json({ enrolled: !!enrollment });
    } catch (error) {
        console.error('Error checking enrollment:', error.message);
        res.json({ enrolled: false });
    }
}

export async function handleGetMyEnrollments(req, res) {
    // ⚠️ SECURITY FIX: Use req.user.email (from JWT) instead of req.query.email
    const email = req.user.email; 

    // The check for email is no longer needed
    // if (!email) { /* ... */ }

    if (!isDBConnected()) {
        return res.json([]);
    }

    try {
        const db = getDB();
        const enrollmentsCollection = db.collection('enrollments');
        const coursesCollection = db.collection('courses');

        // Get enrollments for the user
        const enrollments = await enrollmentsCollection
            .find({ userEmail: email })
            .toArray();

        // Get course details for each enrollment
        const courseIds = enrollments.map(e => e.courseId);
        const courses = await coursesCollection
            .find({ _id: { $in: courseIds } })
            .toArray();

        res.json(courses);
    } catch (error) {
        console.error('Error fetching enrollments:', error.message);
        res.json([]);
    }
}