import * as departmentService from '../services/DepartmentServices.js';

export const createDepartment = async (req, res) => {
    try {
        const result = await departmentService.createDepartmentService(req.body, req.user);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error creating department:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getAllDepartments = async (req, res) => {
    try {
        const result = await departmentService.getAllDepartmentsService(req.user);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error getting departments:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getDepartmentById = async (req, res) => {
    try {
        const result = await departmentService.getDepartmentByIdService(req.params.id, req.user);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error getting department:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const updateDepartment = async (req, res) => {
    try {
        const result = await departmentService.updateDepartmentService(req.params.id, req.body, req.user);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error updating department:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const deleteDepartment = async (req, res) => {
    try {
        const result = await departmentService.deleteDepartmentService(req.params.id, req.user);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error deleting department:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};
