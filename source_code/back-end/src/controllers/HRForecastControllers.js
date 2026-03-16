import * as forecastService from '../services/HRForecastServices.js';

export const createForecast = async (req, res) => {
    try {
        const result = await forecastService.createForecastService(req.body);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error creating forecast:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getAllForecasts = async (req, res) => {
    try {
        const result = await forecastService.getAllForecastsService(req.query);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error getting forecasts:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getForecastById = async (req, res) => {
    try {
        const result = await forecastService.getForecastByIdService(req.params.id);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error getting forecast:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const updateForecast = async (req, res) => {
    try {
        const result = await forecastService.updateForecastService(req.params.id, req.body);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error updating forecast:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};
