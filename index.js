import "dotenv/config";
import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import { handleDemo } from "./routes/demo.js";
import { handleGetCourses, handleCreateCourse, handleUpdateCourse, handleDeleteCourse, handleGetCourse, handleGetMyCourses } from "./routes/courses.js";
import { handleEnroll, handleCheckEnrollment, handleGetMyEnrollments, handleUnenroll, handleUpdateEnrollmentProgress } from "./routes/enrollments.js";
import { handleCreateReview, handleGetCourseReviews, handleDeleteReview } from "./routes/reviews.js";
import { handleUpdateProgress, handleGetUserProgress, handleGetCourseProgress, handleGenerateCertificate, handleGetUserCertificates } from "./routes/progress.js";
import { handleGetNotes, handleCreateNote, handleDeleteNote, handleUpdateNote } from "./routes/notes.js";

let mongoClient = null;
let db = null;

export function getDB() {
  return db;
}

export function isDBConnected() {
  return db !== null;
}

export async function connectDB() {
  try {
    const mongoUrl = process.env.MONGODB_URI;
    if (!mongoUrl) {
      console.warn('MONGODB_URI not configured, running in mock mode');
      return null;
    }

    mongoClient = new MongoClient(mongoUrl);
    await mongoClient.connect();
    const client = mongoClient;
    db = client.db('skillsync');
    console.log('Connected to MongoDB');
    return db;
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    db = null;
    return null;
  }
}

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Courses routes
  app.get("/api/courses", handleGetCourses);
  app.post("/api/courses", handleCreateCourse);
  app.get("/api/courses/user/my-courses", handleGetMyCourses);
  app.get("/api/courses/:id", handleGetCourse);
  app.put("/api/courses/:id", handleUpdateCourse);
  app.delete("/api/courses/:id", handleDeleteCourse);

  // Enrollments routes
  app.post("/api/enrollments", handleEnroll);
  app.get("/api/enrollments/user/my-enrollments", handleGetMyEnrollments);
  app.get("/api/enrollments/check/:courseId", handleCheckEnrollment);
  app.delete("/api/enrollments/user/:courseId", handleUnenroll);
  app.put("/api/enrollments/user/:courseId", handleUpdateEnrollmentProgress);

  // Reviews routes
  app.get("/api/reviews/:courseId", handleGetCourseReviews);
  app.post("/api/reviews", handleCreateReview);
  app.delete("/api/reviews/:id", handleDeleteReview);

  // Progress routes
  app.put("/api/progress/:courseId", handleUpdateProgress);
  app.get("/api/progress/user/:email", handleGetUserProgress);
  app.get("/api/progress/course/:courseId", handleGetCourseProgress);
  app.post("/api/certificates", handleGenerateCertificate);
  app.get("/api/certificates/:email", handleGetUserCertificates);

  // Notes routes
  app.get("/api/notes", handleGetNotes);
  app.post("/api/notes", handleCreateNote);
  app.delete("/api/notes/:id", handleDeleteNote);
  app.put("/api/notes/:id", handleUpdateNote);

  return app;
}
