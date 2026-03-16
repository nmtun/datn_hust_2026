import * as performanceService from '../services/PerformanceServices.js';

export const createPerformance = async (req, res) => {
    try {
        const result = await performanceService.createPerformanceService(req.body, req.user.user_id);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error creating performance:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getAllPerformance = async (req, res) => {
    try {
        const result = await performanceService.getAllPerformanceService();
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error getting performance:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getPerformanceById = async (req, res) => {
    try {
        const result = await performanceService.getPerformanceByIdService(req.params.id, req.user);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error getting performance by id:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const updatePerformance = async (req, res) => {
    try {
        const result = await performanceService.updatePerformanceService(req.params.id, req.body, req.user);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error updating performance:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getMyPerformance = async (req, res) => {
    try {
        const result = await performanceService.getMyPerformanceService(req.user.user_id);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error getting my performance:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getTeamPerformance = async (req, res) => {
    try {
        const result = await performanceService.getTeamPerformanceService(req.user.user_id);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error getting team performance:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};
