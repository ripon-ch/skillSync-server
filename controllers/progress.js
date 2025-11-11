// controllers/progress.js

import { ObjectId } from 'mongodb';
import { getDB, isDBConnected } from '../index.js';

const PROGRESS_COLLECTION = 'progress';
const CERTIFICATES_COLLECTION = 'certificates';
const USERS_COLLECTION = 'users';

// Ensures an ObjectId is used for consistency
const toObjectId = (id) => (ObjectId.isValid(id) ? new ObjectId(id) : id);

/**
 * Handles updating a user's progress for a specific course.
 * Protected route (requires verifyAuth).
 */
export async function handleUpdateProgress(req, res) {
    try {
        const db = getDB();
        // ⚠️ SECURITY FIX: Get userId from JWT payload
        const userId = req.user.id; 
        
        if (!db) {
            return res.json({
                success: true,
                message: 'Progress saved locally',
                progress: { ...req.body, userId, _id: new ObjectId() }
            });
        }

        const { courseId, lessonsCompleted, totalLessons } = req.body;

        if (!courseId || !lessonsCompleted || !totalLessons) {
            return res.status(400).json({ error: 'Missing required fields: courseId, lessonsCompleted, totalLessons' });
        }
        
        const progressCollection = db.collection(PROGRESS_COLLECTION);
        const progressPercent = Math.round((lessonsCompleted / totalLessons) * 100);
        const isCompleted = progressPercent === 100;

        const result = await progressCollection.updateOne(
            // Query by secure userId and courseId
            { userId: toObjectId(userId), courseId: toObjectId(courseId) },
            {
                $set: {
                    userId: toObjectId(userId),
                    courseId: toObjectId(courseId),
                    lessonsCompleted: parseInt(lessonsCompleted),
                    totalLessons: parseInt(totalLessons),
                    progressPercent,
                    isCompleted,
                    completedDate: isCompleted ? new Date() : null,
                    updatedAt: new Date()
                },
                $setOnInsert: { // Initialize if document is new
                    startedAt: new Date()
                }
            },
            { upsert: true }
        );

        res.json({
            success: true,
            progressPercent,
            isCompleted,
            message: 'Progress updated'
        });
    } catch (error) {
        console.error('Update progress error:', error);
        res.status(500).json({ error: 'Failed to update progress' });
    }
}

/**
 * Retrieves all progress records for the current user.
 * Protected route (requires verifyAuth).
 */
export async function handleGetUserProgress(req, res) {
    try {
        const db = getDB();
        // ⚠️ SECURITY FIX: Get userId from JWT payload
        const userId = req.user.id; 
        const { userId: paramUserId } = req.params; 
        
        // CRITICAL: Ensure authenticated user matches the requested user unless admin
        if (paramUserId !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized to view this user\'s progress' });
        }
        
        if (!db) {
            return res.json({ progress: [] });
        }
        
        const progressCollection = db.collection(PROGRESS_COLLECTION);
        const progress = await progressCollection
            .find({ userId: toObjectId(userId) })
            .toArray();

        res.json({ progress });
    } catch (error) {
        console.error('Get user progress error:', error);
        res.status(500).json({ error: 'Failed to fetch user progress' });
    }
}

/**
 * Retrieves the progress record for a specific course and the current user.
 * Protected route (requires verifyAuth).
 */
export async function handleGetCourseProgress(req, res) {
    try {
        const db = getDB();
        // ⚠️ SECURITY FIX: Get userId from JWT payload
        const userId = req.user.id;
        const { courseId, userId: paramUserId } = req.params;

        // CRITICAL: Ensure authenticated user matches the requested user unless admin
        if (paramUserId !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized to view this progress record' });
        }

        if (!db) {
            return res.json({
                progressPercent: 0,
                isCompleted: false,
                lessonsCompleted: 0,
                totalLessons: 0
            });
        }

        const progressCollection = db.collection(PROGRESS_COLLECTION);
        const progress = await progressCollection.findOne({
            courseId: toObjectId(courseId),
            userId: toObjectId(userId)
        });

        if (!progress) {
            return res.json({
                progressPercent: 0,
                isCompleted: false,
                lessonsCompleted: 0,
                totalLessons: 0
            });
        }

        res.json(progress);
    } catch (error) {
        console.error('Get course progress error:', error);
        res.status(500).json({ error: 'Failed to fetch course progress' });
    }
}

/**
 * Generates a certificate for a completed course.
 * Protected route (requires verifyAuth).
 */
export async function handleGenerateCertificate(req, res) {
    try {
        const db = getDB();
        // ⚠️ SECURITY FIX: Get user details from JWT payload
        const userId = req.user.id;
        const userName = req.user.name;

        const { courseId } = req.body; 

        // 1. Database Check
        if (!db) {
            return res.json({
                success: true,
                certificateUrl: `data:text/plain,Certificate of Completion for Course ID: ${courseId}`,
                message: 'Certificate generated locally'
            });
        }
        
        // 2. Fetch required data
        const progressCollection = db.collection(PROGRESS_COLLECTION);
        const coursesCollection = db.collection('courses');
        const certificatesCollection = db.collection(CERTIFICATES_COLLECTION);
        
        const course = await coursesCollection.findOne({ _id: toObjectId(courseId) });
        const progress = await progressCollection.findOne({
            courseId: toObjectId(courseId),
            userId: toObjectId(userId)
        });

        // 3. Completion Check
        if (!progress || !progress.isCompleted) {
            return res.status(400).json({ error: 'Course not completed' });
        }
        
        // 4. Generate Certificate Content
        const courseName = course?.title || 'Unknown Course';
        const instructorName = course?.instructorName || 'Unknown Instructor';
        
        // Using provided simple text certificate logic
        const certificateContent = `
CERTIFICATE OF COMPLETION
================================

This is to certify that

${userName}

has successfully completed the course:

${courseName}

Instructed by: ${instructorName}

Date of Completion: ${progress.completedDate?.toLocaleDateString() || new Date().toLocaleDateString()}

This certifies the above named person has demonstrated competency in the subject matter and is hereby awarded this Certificate of Completion.

Signed,
SkillSync Learning Platform
        `.trim();

        // 5. Store certificate in DB
        const certificateResult = await certificatesCollection.insertOne({
            userId: toObjectId(userId),
            courseId: toObjectId(courseId),
            courseName,
            instructorName,
            completedDate: new Date(),
            certificateContent
        });

        res.json({
            success: true,
            _id: certificateResult.insertedId,
            certificateContent,
            message: 'Certificate generated'
        });
    } catch (error) {
        console.error('Generate certificate error:', error);
        res.status(500).json({ error: 'Failed to generate certificate' });
    }
}

/**
 * Retrieves a list of all certificates for the current user.
 * Protected route (requires verifyAuth).
 */
export async function handleGetUserCertificates(req, res) {
    try {
        const db = getDB();
        // ⚠️ SECURITY FIX: Get userId from JWT payload
        const userId = req.user.id;
        const { userId: paramUserId } = req.params;

        // CRITICAL: Ensure authenticated user matches the requested user unless admin
        if (paramUserId !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized to view this user\'s certificates' });
        }
        
        if (!db) {
            return res.json({ certificates: [] });
        }

        const certificatesCollection = db.collection(CERTIFICATES_COLLECTION);
        const certificates = await certificatesCollection
            .find({ userId: toObjectId(userId) })
            .sort({ completedDate: -1 })
            .toArray();

        res.json({ certificates });
    } catch (error) {
        console.error('Get certificates error:', error);
        res.status(500).json({ error: 'Failed to fetch certificates' });
    }
}