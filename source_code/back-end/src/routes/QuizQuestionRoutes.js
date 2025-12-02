import express from 'express';
import * as questionController from '../controllers/QuizQuestionControllers.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Question CRUD routes
router.post('/create', authenticate, authorize("hr"), questionController.createQuestion);
router.get('/get-all', authenticate, questionController.getAllQuestions);
router.get('/get/:id', authenticate, questionController.getQuestionById);
router.put('/update/:id', authenticate, authorize("hr"), questionController.updateQuestion);
router.delete('/delete/:id', authenticate, authorize("hr"), questionController.deleteQuestion);

// Quiz-specific question routes
router.get('/quiz/:quizId', authenticate, questionController.getQuestionsByQuizId);
router.delete('/quiz/:quizId', authenticate, authorize("hr"), questionController.deleteQuestionsByQuizId);

// Bulk operations
router.post('/bulk-create', authenticate, authorize("hr"), questionController.bulkCreateQuestions);

// Tag-based routes
router.get('/by-tags', authenticate, questionController.getQuestionsByTags);

export default router;