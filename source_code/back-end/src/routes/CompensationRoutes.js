import express from 'express';
import * as compensationController from '../controllers/CompensationControllers.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', authenticate, authorize("manager"), compensationController.createCompensation);
router.get('/get-all', authenticate, authorize("manager"), compensationController.getAllCompensation);
router.post('/recommendations', authenticate, authorize("manager"), compensationController.getCompensationRecommendations);
router.post('/recommendations/save', authenticate, authorize("manager"), compensationController.saveCompensationRecommendations);
router.put('/update/:id', authenticate, authorize("manager"), compensationController.updateCompensation);
router.get('/my', authenticate, authorize("employee", "manager", "hr"), compensationController.getMyCompensation);
router.get('/employee/:userId', authenticate, authorize("manager"), compensationController.getCompensationByEmployee);

export default router;
