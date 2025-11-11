// controllers/auth.js

import { getDB } from '../index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const USERS_COLLECTION = 'users';

/**
 * Handles user registration: Hashing password, checking for existing user, and saving to DB.
 */
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
            name: user.name
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
        // This should theoretically not happen if verifyAuth runs first, but is a safeguard.
        return res.status(401).json({ message: 'Authentication required.' });
    }
    
    // We already have the essential user data from the token (req.user)
    // For this basic implementation, we return the data from the token.
    // In complex apps, you might fetch fresh data from the DB using req.user.id.
    try {
        const db = getDB();
        
        // We need to use ObjectID for MongoDB lookups if we were to fetch by ID
        // For simplicity, we'll just return the token payload data.
        // If you need the full DB user data (excluding password), use this:
        /*
        const user = await db.collection(USERS_COLLECTION).findOne(
            { _id: new ObjectId(req.user.id) },
            { projection: { password: 0 } } // Exclude password field
        );
        if (!user) return res.status(404).json({ message: 'User not found.' });
        */

        res.json({ user: req.user, message: 'User data retrieved successfully.' });
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