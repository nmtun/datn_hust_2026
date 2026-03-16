import * as employeeService from '../services/EmployeeServices.js';
import * as userService from '../services/UserServices.js';
import bcrypt from 'bcrypt';

export const createEmployee = async (req, res) => {
    try {
        const {
            personal_email,
            company_email,
            password,
            full_name,
            phone_number,
            address,
            role,
            hire_date = new Date(),
            position,
            termination_date = null,
            employee_id_number,
        } = req.body;

        if (!personal_email) return res.status(400).json({ error: true, message: "Personal email is required" });
        if (!company_email) return res.status(400).json({ error: true, message: "Company email is required" });
        if (!password) return res.status(400).json({ error: true, message: "Password is required" });
        if (!full_name) return res.status(400).json({ error: true, message: "Full name is required" });
        if (!phone_number) return res.status(400).json({ error: true, message: "Phone number is required" });
        if (!address) return res.status(400).json({ error: true, message: "Address is required" });
        if (!role) return res.status(400).json({ error: true, message: "Role is required" });

        const existingUser = await userService.findUserByEmailService(personal_email);
        if (existingUser) return res.status(409).json({ error: true, message: "Personal email already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await userService.createUserService({
            personal_email,
            company_email,
            password: hashedPassword,
            full_name,
            phone_number,
            address,
            role,
        });

        const employee = await employeeService.createEmployeeService({
            user_id: user.user_id,
            hire_date,
            position,
            termination_date,
            employee_id_number
        });

        res.status(201).json({
            error: false,
            message: "Employee created successfully",
            user,
            employee
        });

    } catch (error) {
        console.error("Error creating employee:", error);
        res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getMyProfile = async (req, res) => {
    try {
        const result = await employeeService.getMyProfileService(req.user.user_id);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error getting profile:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const updateMyProfile = async (req, res) => {
    try {
        const { phone_number, address } = req.body;
        const result = await employeeService.updateMyProfileService(req.user.user_id, { phone_number, address });
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error updating profile:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getAllEmployees = async (req, res) => {
    try {
        const result = await employeeService.getAllEmployeesService(req.query);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error getting employees:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getEmployeeById = async (req, res) => {
    try {
        const result = await employeeService.getEmployeeByIdService(req.params.id);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error getting employee:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const updateEmployee = async (req, res) => {
    try {
        const result = await employeeService.updateEmployeeService(req.params.id, req.body);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error updating employee:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const updateEmployeeStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) return res.status(400).json({ error: true, message: "Status is required" });
        const result = await employeeService.updateEmployeeStatusService(req.params.id, status);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error updating employee status:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getMyTeam = async (req, res) => {
    try {
        const result = await employeeService.getMyTeamService(req.user.user_id);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error getting team:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};
