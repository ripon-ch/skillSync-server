import express from 'express';
import { 
    handleGetCourses, 
    handleGetCourse, 
    handleCreateCourse, 
    handleUpdateCourse, 
    handleDeleteCourse, 
    handleGetMyCourses 
} from '../controllers/courses.js';

const router = express.Router();