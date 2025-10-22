import express from 'express';
import * as jobdescriptionController from '../controllers/JobDescriptionControllers.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', authenticate, authorize("hr"), jobdescriptionController.createJobDescription);
router.get('/get-all', jobdescriptionController.getAllJobDescriptions);
router.get('/get/:id', jobdescriptionController.getJobDescriptionById);
router.put('/update/:id', authenticate, authorize("hr"), jobdescriptionController.updateJobDescription);
router.delete('/delete/:id', authenticate, authorize("hr"), jobdescriptionController.deleteJobDescription);

export default router;