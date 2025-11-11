// controllers/auth.js

import { getDB, isDBConnected } from '../index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb'; // Import ObjectId

const USERS_COLLECTION = 'users';

/**
 * Handles user registration: Hashing password, checking for existing user, and saving to DB.
 */
export const handleRegister = async (req, res) => {
    // FIX: Add photoUrl
    const { name, email, password, role, photoUrl } = req.body;
    
    // 1. Basic Validation
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please provide name, email, and password.' });
    }

    // FIX: Password Validation (SERVER-SIDE)
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }
    if (!/[A-Z]/.test(password)) {
        return res.status(400).json({ message: 'Password must contain at least one uppercase letter.' });
    }
    if (!/[a-z]/.test(password)) {
        return res.status(400).json({ message: 'Password must contain at least one lowercase letter.' });
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
            photoUrl: photoUrl || null, // FIX: Save the photoUrl
            createdAt: new Date(),
        };

        const result = await db.collection(USERS_COLLECTION).insertOne(newUser);
        
        // 5. Success response
        res.status(201).json({ 
            message: 'User registered successfully. Proceed to login.',
            userId: result.insertedId 
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error during registration.' });
    }
};

/**
 * Handles user login: Verifying password and generating a JWT token.
 */
export const handleLogin = async (req, res) => {
    const { email, password } = req.body;

    // 1. Basic Validation
    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password.' });
    }

    try {
        const db = getDB();

        // 2. Find User by Email
        const user = await db.collection(USERS_COLLECTION).findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // 3. Compare Password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // 4. Generate JWT Token
        const payload = {
            id: user._id,
            role: user.role,
            name: user.name,
            email: user.email // Added email to payload
        };
        
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET, // Ensure JWT_SECRET is set in your .env
            { expiresIn: '1h' } 
        );

        // 5. Success response: Send the token and user details
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            message: 'Login successful.'
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error during login.' });
    }
};

/**
 * Handles fetching the current user's details (used after token verification by middleware).
 */
export const handleGetUser = async (req, res) => {
    // The verifyAuth middleware attaches the decoded JWT payload to req.user
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required.' });
    }
    
    try {
        const db = getDB();
        
        // Fetch fresh data from DB using req.user.id to ensure it's up-to-date
        const user = await db.collection(USERS_COLLECTION).findOne(
            { _id: new ObjectId(req.user.id) },
            { projection: { password: 0 } } // Exclude password field
        );
        if (!user) return res.status(404).json({ message: 'User not found.' });
        
        res.json({ user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            photoUrl: user.photoUrl // Send photoUrl back
        }, message: 'User data retrieved successfully.' });

    } catch (error) {
        console.error('Get User error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

/**
 * Handles user logout (client-side token removal).
 */
export const handleLogout = (req, res) => {
    // In a stateless JWT system, logout is generally a client-side action (deleting the token).
    // The server just confirms the action.
    res.json({ message: 'Logout successful. Please discard your token.' });
};