import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';

// --- AUTH ROUTER IMPORT ---
// Assuming you created a routes/auth.js file that exports a default router
import authRouter from './routes/auth.js'; 

// --- ROUTE HANDLER IMPORTS ---
import {
  handleGetCourses,
  handleGetCourse,
  handleCreateCourse,
  handleUpdateCourse,
  handleDeleteCourse,
  handleGetMyCourses,
} from './routes/courses.js';
import {
  handleEnroll,
  handleCheckEnrollment,
  handleGetMyEnrollments,
} from './routes/enrollments.js';
import {
  handleCreateReview,
  handleGetCourseReviews,
  handleDeleteReview,
} from './routes/reviews.js';
import {
  handleUpdateProgress,
  handleGetUserProgress,
  handleGetCourseProgress,
  handleGenerateCertificate,
  handleGetUserCertificates,
} from './routes/progress.js';

let db = null;

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/api/ping', (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? 'pong';
    res.json({ message: ping });
  });

  // --- ROUTE DEFINITIONS ---
  
  // Auth routes
  app.use('/api/auth', authRouter); // REQUIRED FIX: Integration of the Auth Router

  // Courses routes
  app.get('/api/courses', handleGetCourses);
  app.get('/api/courses/featured', handleGetCourses); // ADDED: For featured courses section
  app.get('/api/courses/:id', handleGetCourse);
  app.post('/api/courses', handleCreateCourse);
  app.put('/api/courses/:id', handleUpdateCourse);
  app.delete('/api/courses/:id', handleDeleteCourse);
  app.get('/api/courses/user/my-courses', handleGetMyCourses);

  // Enrollments routes
  app.post('/api/enrollments', handleEnroll);
  app.get('/api/enrollments/check/:courseId', handleCheckEnrollment);
  app.get('/api/enrollments/user/my-enrollments', handleGetMyEnrollments);

  // Reviews routes
  app.post('/api/reviews', handleCreateReview);
  app.get('/api/reviews/:courseId', handleGetCourseReviews);
  app.delete('/api/reviews/:reviewId', handleDeleteReview);

  // Progress routes
  app.put('/api/progress', handleUpdateProgress);
  app.get('/api/progress/:userId', handleGetUserProgress);
  app.get('/api/progress/:courseId/:userId', handleGetCourseProgress);

  // Certificate routes
  app.post('/api/certificates/generate', handleGenerateCertificate);
  app.get('/api/certificates/:userId', handleGetUserCertificates);

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

    console.log('Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('MongoDB connection error (app will work with mock data):', error.message);
    // Don't exit - app will work with mock data
    return null;
  }
}

export function getDB() {
  return db;
}

export function isDBConnected() {
  return db !== null;
}

// --------------------------------------------------------
// >>> CRITICAL FIX: SERVER START BLOCK <<<
// This is necessary to bind the application to a port and keep it running.
// --------------------------------------------------------

const PORT = process.env.PORT || 5000;

async function startServer() {
  const app = createServer();
  const dbInstance = await connectDB(); 
  
  // Start the Express server and listen on the port
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Database Status: ${dbInstance ? 'Connected' : 'Unavailable'}`);
  });
}

// Execute the function to start the application
startServer();