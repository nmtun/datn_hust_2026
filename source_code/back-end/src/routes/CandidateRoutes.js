import express from 'express';
import * as candidateController from '../controllers/CandidateControllers.js';
import multer from 'multer';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/create', upload.single('cv'), candidateController.createCandidate);

export default router;