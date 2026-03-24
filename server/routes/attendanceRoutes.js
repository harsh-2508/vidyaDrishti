import express from 'express';
import {
  checkIn,
  getClassReport,
  updateAttendanceStatus, // The new function
  getStudentStats,
  updateFocusScore,
  getStudentHistoryForTeacher
} from '../controllers/attendanceController.js';
import { protect, restrictTo } from '../controllers/authController.js';

const router = express.Router();

router.use(protect); // All routes require login

// Student Routes
router.post('/check-in', restrictTo('student'), checkIn);
router.get('/stats', restrictTo('student'), getStudentStats);
router.patch('/focus', restrictTo('student'), updateFocusScore);
router.get('/student-history', restrictTo('teacher'), getStudentHistoryForTeacher);

// Teacher Routes
router.get('/report/:classId', restrictTo('teacher'), getClassReport);

// ✅ THIS IS THE FIX: The frontend calls /update, so we need this route.
router.patch('/update', restrictTo('teacher'), updateAttendanceStatus);

export default router;