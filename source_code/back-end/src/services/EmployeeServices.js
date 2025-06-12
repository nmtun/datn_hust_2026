import Employee from '../models/Employee.js';

// Create employee service
export const createEmployee = async (employeeData) => {
    return await Employee.create(employeeData);
};