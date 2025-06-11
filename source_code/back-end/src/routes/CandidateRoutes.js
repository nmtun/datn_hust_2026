import express from 'express';
import * as candidateController from '../controllers/CandidateControllers.js';

const router = express.Router();

router.post('/create', candidateController.createCandidate);

export default router;