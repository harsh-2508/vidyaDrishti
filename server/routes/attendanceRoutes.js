// routes/attendanceRoutes.js

import express from 'express';
// Import the specific functions you exported from the controller
// ... imports ...
import {
  checkIn,
  verifyByCamera,
  getClassReport,
  manualMarkAttendance, // <-- Import new function
  getStudentStats,
  getStudentClassHistory
} from '../controllers/attendanceController.js';

// You also need to import the auth middleware
import { protect, restrictTo } from '../controllers/authController.js'; // Make sure to add .js

const router = express.Router();

// Protect all routes
router.use(protect);

// Use the imported functions
router.post('/check-in', restrictTo('student'), checkIn);

router.post('/verify-camera', restrictTo('teacher'), verifyByCamera);

router.get('/report/:classId', restrictTo('teacher'), getClassReport);

// ... other routes ...
router.post('/mark', restrictTo('teacher'), manualMarkAttendance); // <-- Add this route
router.get('/stats', restrictTo('student'), getStudentStats);

// NEW ROUTE: Get details for a specific class
router.get('/history/:classId', restrictTo('student'), getStudentClassHistory);

// Use 'export default'
export default router;