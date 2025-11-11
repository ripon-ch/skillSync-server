// controllers/auth.js

// Ensure you have run 'npm install bcryptjs jsonwebtoken'
import { getDB } from '../index.js'; // To access the MongoDB connection
import bcrypt from 'bcryptjs'; 
// import jwt from 'jsonwebtoken'; // We will use this in handleLogin next

// Assuming you will create a 'users' collection in your connectDB function if it doesn't exist
const USERS_COLLECTION = 'users';

export const handleRegister = async (req, res) => {
    const { name, email, password, role } = req.body;
    
    // 1. Basic Validation
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please provide name, email, and password.' });
    }

    try {
        const db = getDB();
        
        // 2. Check if user already exists
        const existingUser = await db.collection(USERS_COLLECTION).findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists.' });
        }

        // 3. Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Create new user object and insert into DB
        const newUser = {
            name,
            email,
            password: hashedPassword,
            role: role || 'student', // Default role is student
            createdAt: new Date(),
        };

        const result = await db.collection(USERS_COLLECTION).insertOne(newUser);
        
        // 5. Success response (without sending the password hash back)
        res.status(201).json({ 
            message: 'User registered successfully. Proceed to login.',
            userId: result.insertedId 
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error during registration.' });
    }
};

// Placeholder handler for user login (TO BE IMPLEMENTED NEXT)
export const handleLogin = (req, res) => {
    res.status(501).json({ message: 'Login logic not yet implemented.' });
};

// Placeholder handler for getting user details
export const handleGetUser = (req, res) => {
    res.status(501).json({ message: 'Get User logic not yet implemented.' });
};

// Placeholder handler for logout
export const handleLogout = (req, res) => {
    res.status(501).json({ message: 'Logout logic not yet implemented.' });
};