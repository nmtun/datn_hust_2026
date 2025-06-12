import express from 'express';
import * as employeeController from '../controllers/EmployeeControllers.js';
import e from 'express';

const router = express.Router();

router.post('/create', employeeController.createEmployee);

export default router;
