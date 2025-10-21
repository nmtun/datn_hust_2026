import express from 'express';
import * as candidateController from '../controllers/CandidateControllers.js';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/create', upload.single('cv'), candidateController.createCandidate);
router.get('/get-all', authenticate, authorize("hr"), candidateController.getAllCandidates);

export default router;