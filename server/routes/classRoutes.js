// routes/classRoutes.js

import express from 'express';
import {
  createClass,
  joinClass,
  getMyClasses,
  updateClass,
} from '../controllers/classController.js'; // Make sure to add .js
import { protect, restrictTo } from '../controllers/authController.js'; // Make sure to add .js

const router = express.Router();

// ALL routes below this point are protected
router.use(protect);

router.get('/my-classes', getMyClasses);

router.post(
  '/',
  restrictTo('teacher'),
  createClass
);

router.post(
  '/join',
  restrictTo('student'),
  joinClass
);

// --- NEW ROUTE ---
// Only teachers can update a specific class by ID
router.patch('/:id', restrictTo('teacher'), updateClass);

router.post('/join', restrictTo('student'), joinClass);

// Use 'export default'
export default router;