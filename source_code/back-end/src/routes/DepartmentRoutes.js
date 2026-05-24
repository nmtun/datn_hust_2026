import express from 'express';
import * as departmentController from '../controllers/DepartmentControllers.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', authenticate, authorize("hr", "manager", "tenant_admin"), departmentController.createDepartment);
router.get('/get-all', authenticate, authorize("hr", "manager", "employee", "tenant_admin"), departmentController.getAllDepartments);
router.get('/get/:id', authenticate, authorize("hr", "manager", "employee", "tenant_admin"), departmentController.getDepartmentById);
router.put('/update/:id', authenticate, authorize("hr", "manager", "tenant_admin"), departmentController.updateDepartment);
router.delete('/delete/:id', authenticate, authorize("hr", "manager", "tenant_admin"), departmentController.deleteDepartment);

export default router;
