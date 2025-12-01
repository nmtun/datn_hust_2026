import express from 'express';
import * as trainingMaterialController from '../controllers/TrainingMaterialControllers.js';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        // Chấp nhận các loại file: pdf, doc, docx, ppt, pptx, mp4, avi, mov, etc.
        const allowedMimes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'video/mp4',
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed'), false);
        }
    }
});

// Routes cho training materials
router.post('/create', authenticate, authorize("hr"), upload.array('files', 10), trainingMaterialController.createTrainingMaterial);
router.get('/get-all', authenticate, trainingMaterialController.getAllTrainingMaterials);
router.get('/get/:id', authenticate, trainingMaterialController.getTrainingMaterialById);
router.put('/update/:id', authenticate, authorize("hr"), upload.array('files', 10), trainingMaterialController.updateTrainingMaterial);
router.delete('/delete/:id', authenticate, authorize("hr"), trainingMaterialController.deleteTrainingMaterial);
router.get('/get-archived', authenticate, authorize("hr"), trainingMaterialController.getArchivedTrainingMaterials);
router.post('/restore/:id', authenticate, authorize("hr"), trainingMaterialController.restoreTrainingMaterial);
router.get('/search', authenticate, trainingMaterialController.searchTrainingMaterials);

// File download routes
import * as fileController from '../controllers/FileControllers.js';
router.get('/download/:filename', authenticate, fileController.downloadFile);

export default router;