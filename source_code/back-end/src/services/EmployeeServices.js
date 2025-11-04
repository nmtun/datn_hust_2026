import Employee from '../models/Employee.js';

// Create employee service
export const createEmployeeService = async (employeeData) => {
    return await Employee.create(employeeData);
};