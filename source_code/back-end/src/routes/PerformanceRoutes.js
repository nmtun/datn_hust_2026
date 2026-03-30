import express from 'express';
import * as performanceController from '../controllers/PerformanceControllers.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', authenticate, authorize("hr", "manager", "employee"), performanceController.createPerformance);
router.get('/get-all', authenticate, authorize("hr", "manager", "employee"), performanceController.getAllPerformance);
router.get('/evaluables', authenticate, authorize("hr", "manager", "employee"), performanceController.getEvaluableEmployees);
router.get('/my', authenticate, authorize("employee", "manager", "hr"), performanceController.getMyPerformance);
router.get('/team', authenticate, authorize("manager", "employee"), performanceController.getTeamPerformance);
router.get('/get/:id', authenticate, authorize("hr", "manager", "employee"), performanceController.getPerformanceById);
router.put('/update/:id', authenticate, authorize("hr", "manager", "employee"), performanceController.updatePerformance);

export default router;
