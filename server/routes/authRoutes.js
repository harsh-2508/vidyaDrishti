import express from 'express';
// Import the correct function names
import { signup, login, getMe, protect, registerFace } from '../controllers/authController.js';

const router = express.Router();

// Use the correct function names
router.post('/signup', signup);
router.post('/login', login);

router.get('/me', protect, getMe);

// ... existing routes
router.put('/register-face', protect, registerFace); // New Route

// Use 'export default' because you are importing it in server.js
export default router;