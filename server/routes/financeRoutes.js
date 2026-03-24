import express from 'express';
import {protect,restrictTo} from '../controllers/authController.js'
import { 
    createBudgetRequest, 
    getMyBudgetRequests,
    toggleRequestStatus
} from '../controllers/financeController.js';

const router=express.Router();

// Protect all routes (Must be logged in)
router.use(protect);

// Only Teachers/Headmasters can access finance
router.use(restrictTo('teacher','admin'));

router.route('/')
  .get(getMyBudgetRequests)
  .post(createBudgetRequest)

// Hidden route to simulate government approval
router.patch('/:id/toggle',toggleRequestStatus);

export default router;