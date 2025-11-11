// routes/auth.js
import express from 'express';
import { 
    handleRegister, 
    handleLogin, 
    handleGetUser, 
    handleLogout 
} from '../controllers/auth.js';

const router = express.Router();

// Public routes
router.post('/register', handleRegister);
router.post('/login', handleLogin);

// Private/Protected routes
router.get('/user', handleGetUser);
router.post('/logout', handleLogout);

// Export the router so index.js can use it
export default router;