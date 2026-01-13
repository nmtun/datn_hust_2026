import express from 'express';
import * as quizResultController from '../controllers/QuizResultControllers.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Submit quiz result (employee)
router.post('/submit', authenticate, quizResultController.submitQuizResult);

// Get current user's quiz results (employee)
router.get('/my-results', authenticate, quizResultController.getQuizResultsByUser);

// Get specific quiz result by ID (employee)
router.get('/get/:id', authenticate, quizResultController.getQuizResultById);

// Get attempt history for a specific quiz (employee)
router.get('/quiz/:quizId/attempts', authenticate, quizResultController.getQuizAttemptHistory);

// Get all quiz results with filters (HR/Manager)
router.get('/get-all', authenticate, authorize("hr", "manager"), quizResultController.getAllQuizResults);

export default router;
