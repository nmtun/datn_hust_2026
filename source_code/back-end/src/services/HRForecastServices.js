import '../models/associations.js';
import HRForecast from '../models/HRForecast.js';
import Department from '../models/Department.js';

export const createForecastService = async (data) => {
    try {
        const { period, department_id, current_headcount, predicted_needs, creation_date, notes } = data;
        const forecast = await HRForecast.create({
            period, department_id: department_id || null,
            current_headcount, predicted_needs,
            creation_date: creation_date || new Date(), notes
        });
        return { status: 201, data: { error: false, message: "HR Forecast created successfully", forecast } };
    } catch (error) {
        console.error('Error in createForecastService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const getAllForecastsService = async (query = {}) => {
    try {
        const where = {};
        if (query.department_id) where.department_id = query.department_id;

        const forecasts = await HRForecast.findAll({
            where,
            include: [{ model: Department, as: 'department', attributes: ['department_id', 'name', 'code'] }],
            order: [['creation_date', 'DESC']]
        });
        return { status: 200, data: { error: false, message: "Forecasts retrieved successfully", forecasts } };
    } catch (error) {
        console.error('Error in getAllForecastsService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const getForecastByIdService = async (id) => {
    try {
        const forecast = await HRForecast.findByPk(id, {
            include: [{ model: Department, as: 'department', attributes: ['department_id', 'name', 'code'] }]
        });
        if (!forecast) return { status: 404, data: { error: true, message: "Forecast not found" } };
        return { status: 200, data: { error: false, message: "Forecast retrieved successfully", forecast } };
    } catch (error) {
        console.error('Error in getForecastByIdService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const updateForecastService = async (id, data) => {
    try {
        const forecast = await HRForecast.findByPk(id);
        if (!forecast) return { status: 404, data: { error: true, message: "Forecast not found" } };

        const allowed = ['period', 'department_id', 'current_headcount', 'predicted_needs', 'creation_date', 'notes'];
        const updateData = {};
        Object.keys(data).forEach(key => { if (allowed.includes(key)) updateData[key] = data[key]; });

        await forecast.update(updateData);
        return { status: 200, data: { error: false, message: "Forecast updated successfully" } };
    } catch (error) {
        console.error('Error in updateForecastService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};
