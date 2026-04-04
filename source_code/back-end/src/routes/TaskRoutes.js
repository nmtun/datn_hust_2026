import express from 'express';
import * as taskController from '../controllers/TaskControllers.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', authenticate, authorize('hr', 'manager', 'employee'), taskController.createTask);
router.get('/get-all', authenticate, authorize('hr', 'manager', 'employee'), taskController.getAllTasks);
router.get('/get/:id', authenticate, authorize('hr', 'manager', 'employee'), taskController.getTaskById);
router.put('/update/:id', authenticate, authorize('hr', 'manager', 'employee'), taskController.updateTask);
router.put('/status/:id', authenticate, authorize('hr', 'manager', 'employee'), taskController.updateTaskStatus);
router.delete('/delete/:id', authenticate, authorize('hr', 'manager', 'employee'), taskController.deleteTask);

router.get('/:id/comments', authenticate, authorize('hr', 'manager', 'employee'), taskController.getTaskComments);
router.post('/:id/comments', authenticate, authorize('hr', 'manager', 'employee'), taskController.addTaskComment);
router.post('/:id/reviews', authenticate, authorize('hr', 'manager', 'employee'), taskController.createTaskReview);

export default router;
