import * as compensationService from '../services/CompensationServices.js';

export const createCompensation = async (req, res) => {
    try {
        const result = await compensationService.createCompensationService(req.body, req.user.user_id);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error creating compensation:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getAllCompensation = async (req, res) => {
    try {
        const result = await compensationService.getAllCompensationService();
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error getting compensation:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getCompensationByEmployee = async (req, res) => {
    try {
        const result = await compensationService.getCompensationByEmployeeService(req.params.userId);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error getting employee compensation:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const updateCompensation = async (req, res) => {
    try {
        const result = await compensationService.updateCompensationService(req.params.id, req.body);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error updating compensation:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getMyCompensation = async (req, res) => {
    try {
        const result = await compensationService.getMyCompensationService(req.user.user_id);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error getting my compensation:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getCompensationRecommendations = async (req, res) => {
    try {
        const result = await compensationService.getCompensationRecommendationsService({
            year: req.body?.year,
            requestingUser: req.user
        });
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error getting compensation recommendations:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const saveCompensationRecommendations = async (req, res) => {
    try {
        const result = await compensationService.saveCompensationRecommendationsService({
            year: req.body?.year,
            recommendations: req.body?.recommendations,
            requestingUser: req.user
        });
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error saving compensation recommendations:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};
