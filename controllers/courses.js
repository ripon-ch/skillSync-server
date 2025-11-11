// controllers/courses.js

import { ObjectId } from 'mongodb';
import { getDB, isDBConnected } from '../index.js';

// --- MOCK DATA (kept for robustness) ---
const mockCourses = [
    // ... (Your mock data remains here)
];
const COURSES_COLLECTION = 'courses';

// --- HANDLER FUNCTIONS ---

export async function handleGetCourses(req, res) {
    if (!isDBConnected()) {
        return res.json(mockCourses);
    }

    try {
        const db = getDB();
        const collection = db.collection(COURSES_COLLECTION);

        // FIX: Destructure 'category' from the query
        const { featured, category } = req.query; 
        let query = {};
        
        // Handle featured courses
        if (featured === 'true' || req.originalUrl.includes('/featured')) { 
            query.isFeatured = true;
        }

        // FIX: Add category to the query if it exists
        if (category) {
            query.category = category;
        }

        const courses = await collection.find(query).toArray();
        
        // Fallback to mock data if DB is connected but empty
        if (!courses || courses.length === 0) {
            return res.json(mockCourses);
        }
        res.json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error.message);
        // Fallback on error
        res.json(mockCourses);
    }
}

export async function handleGetCourse(req, res) {
    const mockCourse = { /* ... */ }; // keep the mock course object
    if (!isDBConnected()) {
        return res.json(mockCourse);
    }

    try {
        const db = getDB();
        const collection = db.collection(COURSES_COLLECTION);

        // Ensure proper error handling if ID is invalid format
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid Course ID format' });
        }
        
        const course = await collection.findOne({
            _id: new ObjectId(req.params.id),
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.json(course);
    } catch (error) {
        console.error('Error fetching course:', error.message);
        res.json(mockCourse);
    }
}

export async function handleCreateCourse(req, res) {
    // SECURITY CHECK: Middleware ensures req.user exists and has instructor/admin role.
    if (!req.user || (req.user.role !== 'instructor' && req.user.role !== 'admin')) {
        return res.status(403).json({ error: 'Forbidden. Must be an instructor to create a course.' });
    }
    
    const {
        title, description, image, price, duration, category, isFeatured,
    } = req.body;
    
    // Use data from JWT/req.user
    const instructorId = req.user.id; 
    const instructorName = req.user.name;

    if (!title || !description || !image || !price || !duration || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // ... (DB fallback logic remains here)

    try {
        const db = getDB();
        const collection = db.collection(COURSES_COLLECTION);

        const newCourse = {
            title,
            description,
            image,
            price: parseFloat(price),
            duration,
            category,
            isFeatured: !!isFeatured, // <-- ⚠️ SYNTAX FIX: Added comma
            instructorId: new ObjectId(instructorId), // <<< Use req.user.id
            instructorName, // <<< Use req.user.name
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await collection.insertOne(newCourse);
        res.status(201).json({ ...newCourse, _id: result.insertedId });
    } catch (error) {
        console.error('Error creating course:', error.message);
        // ... (Error fallback logic remains here)
        res.status(500).json({ error: 'Failed to create course.' });
    }
}

export async function handleUpdateCourse(req, res) {
    // Your placeholder logic here
}

export async function handleDeleteCourse(req, res) {
    // Your placeholder logic here
}

export async function handleGetMyCourses(req, res) {
    // IMPORTANT FIX: Use req.user.id (from the verified token) for security
    const instructorId = req.user.id; 
    
    if (!instructorId) {
        return res.status(400).json({ error: 'Instructor ID is missing from token.' });
    }

    if (!isDBConnected()) {
        return res.json([]);
    }

    try {
        const db = getDB();
        const collection = db.collection(COURSES_COLLECTION);

        const courses = await collection
            .find({ instructorId: new ObjectId(instructorId) }) // <<< FIX: Query by ID
            .toArray();

        res.json(courses);
    } catch (error) {
        console.error('Error fetching user courses:', error.message);
        res.json([]);
    }
}