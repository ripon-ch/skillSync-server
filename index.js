import "dotenv/config";
import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
// --- ROUTER IMPORTS ---
import authRouter from './routes/auth.js'; 

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

let db = null;

export function createServer() {
    const app = express();

    // Middleware
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Health check endpoint
    app.get("/api/ping", (_req, res) => {
        const ping = process.env.PING_MESSAGE ?? "pong";
        res.json({ message: ping });
    });
  app.use('/api/auth', authRouter);

  // Courses routes
  app.get('/api/courses', handleGetCourses);
  app.get('/api/courses/featured', handleGetCourses); 
  app.get('/api/courses/user/my-courses', handleGetMyCourses);
  app.get('/api/courses/:id', handleGetCourse);
  app.post('/api/courses', handleCreateCourse);
  app.put('/api/courses/:id', handleUpdateCourse);
  app.delete('/api/courses/:id', handleDeleteCourse);

  // Enrollments routes
  app.post('/api/enrollments', handleEnroll);
  app.get('/api/enrollments/check/:courseId', handleCheckEnrollment);
  app.get('/api/enrollments/user/my-enrollments', handleGetMyEnrollments);
    return app;
}

export async function connectDB() {
    try {
        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        db = client.db("online-learning-platform");

        // Create collections if they don't exist
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        if (!collectionNames.includes("courses")) {
            await db.createCollection("courses");
        }

        if (!collectionNames.includes("enrollments")) {
            await db.createCollection("enrollments");
        }

        console.log("Connected to MongoDB");
        return db;
    } catch (error) {
        console.error(
            "MongoDB connection error (app will work with mock data):",
            error.message
        );
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

const PORT = process.env.PORT || 5000;

async function startServer() {
    const app = createServer();
    const dbInstance = await connectDB(); // connectDB sets the 'db' variable globally

    // Start the Express server and listen on the port
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(
            `Database Status: ${dbInstance ? "Connected" : "Unavailable"}`
        );
    });
}

startServer();
