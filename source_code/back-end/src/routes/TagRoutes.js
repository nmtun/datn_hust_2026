import express from 'express';
import * as tagController from '../controllers/TagControllers.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Basic CRUD routes for tags
router.post('/create', authenticate, authorize("hr"), tagController.createTag);
router.get('/get-all', authenticate, tagController.getAllTags);
router.get('/get/:id', authenticate, tagController.getTagById);
router.put('/update/:id', authenticate, authorize("hr"), tagController.updateTag);
router.delete('/delete/:id', authenticate, authorize("hr"), tagController.deleteTag);

// Search tags
router.get('/search', authenticate, tagController.searchTags);

// Material-Tag relationship routes
router.post('/assign-to-material/:materialId', authenticate, authorize("hr"), tagController.assignTagsToMaterial);
router.delete('/remove-from-material/:materialId', authenticate, authorize("hr"), tagController.removeTagsFromMaterial);
router.get('/materials/:id', authenticate, tagController.getMaterialsByTag);

export default router;