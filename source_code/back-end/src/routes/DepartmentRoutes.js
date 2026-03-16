import express from 'express';
import * as departmentController from '../controllers/DepartmentControllers.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', authenticate, authorize("hr", "manager"), departmentController.createDepartment);
router.get('/get-all', authenticate, authorize("hr", "manager", "employee"), departmentController.getAllDepartments);
router.get('/get/:id', authenticate, authorize("hr", "manager", "employee"), departmentController.getDepartmentById);
router.put('/update/:id', authenticate, authorize("hr", "manager"), departmentController.updateDepartment);
router.delete('/delete/:id', authenticate, authorize("hr", "manager"), departmentController.deleteDepartment);

export default router;
