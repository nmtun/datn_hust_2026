import express from 'express';
import * as compensationController from '../controllers/CompensationControllers.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', authenticate, authorize("hr"), compensationController.createCompensation);
router.get('/get-all', authenticate, authorize("hr"), compensationController.getAllCompensation);
router.put('/update/:id', authenticate, authorize("hr"), compensationController.updateCompensation);
router.get('/my', authenticate, authorize("employee", "manager", "hr"), compensationController.getMyCompensation);
router.get('/employee/:userId', authenticate, authorize("hr", "manager"), compensationController.getCompensationByEmployee);

export default router;
