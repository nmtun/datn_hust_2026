import * as periodService from '../services/PerformancePeriodServices.js';

export const createPeriod = async (req, res) => {
    try {
        const result = await periodService.createPeriodService(req.body);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error creating period:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getAllPeriods = async (req, res) => {
    try {
        const result = await periodService.getAllPeriodsService();
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error getting periods:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getPeriodById = async (req, res) => {
    try {
        const result = await periodService.getPeriodByIdService(req.params.id);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error getting period:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const updatePeriod = async (req, res) => {
    try {
        const result = await periodService.updatePeriodService(req.params.id, req.body);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error updating period:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const togglePeriodStatus = async (req, res) => {
    try {
        const result = await periodService.togglePeriodStatusService(req.params.id);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error toggling period status:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};
