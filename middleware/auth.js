// middleware/auth.js

import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;

/**
 * Middleware to verify the JWT token in the Authorization header.
 * Attaches the decoded user payload to req.user.
 */
export const verifyAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization token required.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify the token using the secret key
        const decoded = jwt.verify(token, SECRET);
        
        // Attach the decoded user payload (id, email, role, name) to the request object
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired. Please log in again.' });
        }
        console.error('JWT Verification Error:', error.message);
        return res.status(401).json({ message: 'Invalid token.' });
    }
};

/**
 * Middleware to check if the authenticated user has one of the required roles.
 * Usage: checkRole(['admin', 'instructor'])
 */
export const checkRole = (requiredRoles) => {
    return (req, res, next) => {
        // req.user is guaranteed to exist if verifyAuth runs before this middleware
        const userRole = req.user?.role; 

        if (!userRole) {
             return res.status(403).json({ message: 'Forbidden: User role not found.' });
        }
        
        if (requiredRoles.includes(userRole)) {
            next();
        } else {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
        }
    };
};