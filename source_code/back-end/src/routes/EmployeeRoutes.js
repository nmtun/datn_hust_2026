import express from 'express';
import * as employeeController from '../controllers/EmployeeControllers.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// router.post('/create', authenticate, authorize("hr"), employeeController.createEmployee);
router.post('/create', employeeController.createEmployee);


// Employee / Manager self-service
router.get('/my-profile', authenticate, authorize("employee", "manager", "hr"), employeeController.getMyProfile);
router.put('/my-profile', authenticate, authorize("employee", "manager", "hr"), employeeController.updateMyProfile);

// Manager: view team
router.get('/my-team', authenticate, authorize("manager", "employee"), employeeController.getMyTeam);
router.get('/managed', authenticate, authorize("manager", "employee", "hr"), employeeController.getManagedEmployees);

// HR: employee management
router.get('/get-all', authenticate, authorize("hr", "manager"), employeeController.getAllEmployees);
router.get('/get/:id', authenticate, authorize("hr", "manager"), employeeController.getEmployeeById);
router.put('/update/:id', authenticate, authorize("hr"), employeeController.updateEmployee);
router.put('/status/:id', authenticate, authorize("hr"), employeeController.updateEmployeeStatus);

export default router;
