import express from 'express';
import * as periodController from '../controllers/PerformancePeriodControllers.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', authenticate, authorize("hr", "manager"), periodController.createPeriod);
router.get('/get-all', authenticate, authorize("hr", "manager", "employee"), periodController.getAllPeriods);
router.get('/get/:id', authenticate, authorize("hr", "manager", "employee"), periodController.getPeriodById);
router.put('/update/:id', authenticate, authorize("hr", "manager"), periodController.updatePeriod);
router.put('/toggle-status/:id', authenticate, authorize("hr", "manager"), periodController.togglePeriodStatus);

export default router;
