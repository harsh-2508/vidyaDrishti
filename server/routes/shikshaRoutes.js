import express from 'express';
import { 
    createResource, 
    getClassResources, 
    triggerSOS, 
    analyzeDropoutRisk, 
    getAIRecommendations,
    // 👇 Make sure these are imported!
    generateQuestions, 
    generateLessonPlan 
} from '../controllers/ShikshaController.js';
import { protect, restrictTo } from '../controllers/authController.js';

const router = express.Router();

router.use(protect);

// Existing Routes
router.post('/resources', restrictTo('teacher'), createResource);
router.get('/resources/:classId', getClassResources);
router.post('/sos', restrictTo('student'), triggerSOS);
router.get('/dropout-analysis/:classId', restrictTo('teacher'), analyzeDropoutRisk);
router.post('/ai-recommend', getAIRecommendations);

// 👇 NEW ROUTES (These were missing!)
router.post('/generate-questions', restrictTo('teacher'), generateQuestions);
router.post('/generate-plan', restrictTo('teacher'), generateLessonPlan);

export default router;