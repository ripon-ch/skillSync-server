import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';

// --- MIDDLEWARE IMPORTS ---
// IMPORTANT: These functions are required to protect your routes
import { verifyAuth, checkRole } from './middleware/auth.js'; 

// --- ROUTER IMPORTS (Only for modules using a dedicated router file) ---
import authRouter from './routes/auth.js'; 
import enrollmentsRouter from './routes/enrollments.js';

// --- CONTROLLER HANDLER IMPORTS ---
// CRITICAL FIX: Handlers should be imported from the controllers directory, 
// NOT the routes directory, since you put the logic there.
import {
    handleGetCourses,
    handleGetCourse,
    handleCreateCourse,
    handleUpdateCourse,
    handleDeleteCourse,
    handleGetMyCourses,
} from './controllers/courses.js'; // FIX: Changed path to ./controllers/courses.js

import {
    handleCreateReview,
    handleGetCourseReviews,
    handleDeleteReview,
} from './controllers/reviews.js'; // FIX: Changed path to ./controllers/reviews.js

import {
    handleUpdateProgress,
    handleGetUserProgress,
    handleGetCourseProgress,
    handleGenerateCertificate,
    handleGetUserCertificates,
} from './controllers/progress.js'; // FIX: Changed path to ./controllers/progress.js

let db = null;

export function createServer() {
    const app = express();

    // Middleware
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Define Role-based middleware constants
    const instructorOrAdmin = checkRole(['instructor', 'admin']);

    // Health check endpoint
    app.get('/api/ping', (_req, res) => {
        const ping = process.env.PING_MESSAGE ?? 'pong';
        res.json({ message: ping });
    });

    // ------------------------------------------------------------------
    // --- ROUTE DEFINITIONS ---
    // ------------------------------------------------------------------

    // Auth routes (Uses dedicated router, protection defined inside routes/auth.js)
    app.use('/api/auth', authRouter); 

    // Courses routes
    app.get('/api/courses', handleGetCourses); // Public
    app.get('/api/courses/featured', handleGetCourses); // Public
    app.get('/api/courses/:id', handleGetCourse); // Public

    // CRITICAL SECURITY FIX: Courses CRUD must be protected
    app.post('/api/courses', verifyAuth, instructorOrAdmin, handleCreateCourse);
    app.put('/api/courses/:id', verifyAuth, instructorOrAdmin, handleUpdateCourse);
    app.delete('/api/courses/:id', verifyAuth, instructorOrAdmin, handleDeleteCourse);
    app.get('/api/courses/user/my-courses', verifyAuth, instructorOrAdmin, handleGetMyCourses); 

    // Enrollments routes (USES DEDICATED ROUTER)
    // FIX: Using the imported router simplifies routing and enables middleware in one place
    app.use('/api/enrollments', enrollmentsRouter); 
    
    // Reviews routes
    app.get('/api/reviews/:courseId', handleGetCourseReviews); // Public read
    // SECURITY FIX: Posting and deleting reviews requires authentication
    app.post('/api/reviews', verifyAuth, handleCreateReview);
    app.delete('/api/reviews/:reviewId', verifyAuth, handleDeleteReview);

    // Progress routes
    // SECURITY FIX: All progress routes must be authenticated
    app.put('/api/progress', verifyAuth, handleUpdateProgress);
    app.get('/api/progress/:userId', verifyAuth, handleGetUserProgress);
    app.get('/api/progress/:courseId/:userId', verifyAuth, handleGetCourseProgress);

    // Certificate routes
    // SECURITY FIX: Generating/fetching certificates must be authenticated
    app.post('/api/certificates/generate', verifyAuth, handleGenerateCertificate);
    app.get('/api/certificates/:userId', verifyAuth, handleGetUserCertificates);

    return app;
}

export async function connectDB() {
    try {
        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        db = client.db('online-learning-platform');

        // Create collections if they don't exist
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        if (!collectionNames.includes('courses')) {
            await db.createCollection('courses');
        }

        if (!collectionNames.includes('enrollments')) {
            await db.createCollection('enrollments');
        }
        
        // Ensure 'users', 'reviews', and 'progress' are also created if they don't exist
        if (!collectionNames.includes('users')) {
            await db.createCollection('users');
        }
        if (!collectionNames.includes('reviews')) {
            await db.createCollection('reviews');
        }
        if (!collectionNames.includes('progress')) {
            await db.createCollection('progress');
        }

        console.log('Connected to MongoDB');
        return db;
    } catch (error) {
        console.error('MongoDB connection error (app will work with mock data):', error.message);
        return null;
    }
}

export function getDB() {
    return db;
}

export function isDBConnected() {
    return db !== null;
}