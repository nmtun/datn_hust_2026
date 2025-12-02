import express from 'express';
import * as quizzesController from '../controllers/QuizzesControllers.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Quiz CRUD routes
router.post('/create', authenticate, authorize("hr"), quizzesController.createQuiz);
router.post('/create-with-random-questions', authenticate, authorize("hr"), quizzesController.createQuizWithRandomQuestions);
router.get('/get-all', authenticate, quizzesController.getAllQuizzes);
router.get('/get/:id', authenticate, quizzesController.getQuizById);
router.put('/update/:id', authenticate, authorize("hr"), quizzesController.updateQuiz);
router.delete('/delete/:id', authenticate, authorize("hr"), quizzesController.deleteQuiz);

// Archive and restore routes
router.get('/get-archived', authenticate, authorize("hr"), quizzesController.getArchivedQuizzes);
router.post('/restore/:id', authenticate, authorize("hr"), quizzesController.restoreQuiz);

// Material-Quiz association routes
router.post('/attach-to-material', authenticate, authorize("hr"), quizzesController.attachQuizToMaterial);
router.delete('/detach-from-material/:materialId/:quizId', authenticate, authorize("hr"), quizzesController.detachQuizFromMaterial);

export default router;
