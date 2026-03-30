import express from 'express';
import * as reportController from '../controllers/HRReportControllers.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/employee-count', authenticate, authorize("hr"), reportController.getEmployeeCountReport);
router.get('/employees-by-department', authenticate, authorize("hr"), reportController.getEmployeesByDepartment);
router.get('/turnover', authenticate, authorize("hr"), reportController.getTurnoverReport);
router.get('/performance-summary', authenticate, authorize("hr"), reportController.getPerformanceSummary);

export default router;
