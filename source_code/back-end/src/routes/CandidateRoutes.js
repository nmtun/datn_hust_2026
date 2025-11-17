import express from 'express';
import * as candidateController from '../controllers/CandidateControllers.js';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/create', upload.single('cv'), candidateController.createCandidate);
router.get('/get-all', authenticate, authorize("hr"), candidateController.getAllCandidates);
router.get('/get/:id', authenticate, authorize("hr"), candidateController.getCandidateById);
router.put('/update/:id', authenticate, authorize("hr"), candidateController.updateCandidate);
router.delete('/delete/:id', authenticate, authorize("hr"), candidateController.deleteCandidate);
router.get('/get-deleted', authenticate, authorize("hr"), candidateController.getDeletedCandidates);
router.post('/restore/:id', authenticate, authorize("hr"), candidateController.restoreCandidate);
router.get('/search', authenticate, authorize("hr"), candidateController.searchCandidates);
router.get('/search-deleted', authenticate, authorize("hr"), candidateController.searchDeletedCandidates);
router.put('/application/:id', authenticate, authorize("hr"), candidateController.updateCandidateApplication);

export default router;