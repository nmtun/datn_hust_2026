import express from 'express';
import * as jobdescriptionController from '../controllers/JobDescriptionControllers.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', authenticate, authorize("hr"), jobdescriptionController.createJobDescription);
router.get('/get-all', jobdescriptionController.getAllJobDescriptions);
router.get('/get/:id', jobdescriptionController.getJobDescriptionById);

export default router;