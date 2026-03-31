import express from 'express';
import * as projectController from '../controllers/ProjectControllers.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', authenticate, authorize('manager'), projectController.createProject);
router.get('/get-all', authenticate, authorize('hr', 'manager', 'employee'), projectController.getAllProjects);
router.get('/get/:id', authenticate, authorize('hr', 'manager', 'employee'), projectController.getProjectById);
router.put('/update/:id', authenticate, authorize('manager'), projectController.updateProject);
router.delete('/delete/:id', authenticate, authorize('manager'), projectController.deleteProject);

export default router;
