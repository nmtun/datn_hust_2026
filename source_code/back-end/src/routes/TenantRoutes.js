import express from 'express';
import * as tenantController from '../controllers/TenantControllers.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', authenticate, authorize('super_admin'), tenantController.createTenant);
router.get('/get-all', authenticate, authorize('super_admin'), tenantController.getAllTenants);
router.get('/get/:id', authenticate, authorize('super_admin'), tenantController.getTenantById);
router.put('/update/:id', authenticate, authorize('super_admin'), tenantController.updateTenant);
router.delete('/delete/:id', authenticate, authorize('super_admin'), tenantController.deleteTenant);
router.post('/restore/:id', authenticate, authorize('super_admin'), tenantController.restoreTenant);

export default router;
