import express from 'express';
import * as performanceController from '../controllers/PerformanceControllers.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', authenticate, authorize("hr", "manager"), performanceController.createPerformance);
router.get('/get-all', authenticate, authorize("hr", "manager"), performanceController.getAllPerformance);
router.get('/my', authenticate, authorize("employee", "manager", "hr"), performanceController.getMyPerformance);
router.get('/team', authenticate, authorize("manager"), performanceController.getTeamPerformance);
router.get('/get/:id', authenticate, authorize("hr", "manager", "employee"), performanceController.getPerformanceById);
router.put('/update/:id', authenticate, authorize("hr", "manager"), performanceController.updatePerformance);

export default router;
