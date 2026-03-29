import '../models/associations.js';
import PerformancePeriod from '../models/PerformancePeriod.js';
import Performance from '../models/Performance.js';
import { resolveHierarchyRole } from './HierarchyServices.js';

const canManagePerformancePeriod = async (requestingUser) => {
    if (!requestingUser) return false;
    if (requestingUser.role === 'hr') return true;
    if (requestingUser.role !== 'manager') return false;

    const hierarchyRole = await resolveHierarchyRole({
        userId: requestingUser.user_id,
        role: requestingUser.role
    });

    return hierarchyRole === 'manager';
};

export const createPeriodService = async (data, requestingUser) => {
    try {
        const canManage = await canManagePerformancePeriod(requestingUser);
        if (!canManage) {
            return { status: 403, data: { error: true, message: 'Only HR or senior manager can create performance periods' } };
        }

        const { period_name, start_date, end_date, status = 'planned', description } = data;
        if (!period_name) return { status: 400, data: { error: true, message: "Period name is required" } };
        if (!start_date || !end_date) return { status: 400, data: { error: true, message: "Start date and end date are required" } };

        const period = await PerformancePeriod.create({ period_name, start_date, end_date, status, description });
        return { status: 201, data: { error: false, message: "Performance period created successfully", period } };
    } catch (error) {
        console.error('Error in createPeriodService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const getAllPeriodsService = async () => {
    try {
        const periods = await PerformancePeriod.findAll({ order: [['start_date', 'DESC']] });
        return { status: 200, data: { error: false, message: "Performance periods retrieved successfully", periods } };
    } catch (error) {
        console.error('Error in getAllPeriodsService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const getPeriodByIdService = async (id) => {
    try {
        const period = await PerformancePeriod.findByPk(id, {
            include: [{ model: Performance, as: 'performances', attributes: ['perf_id', 'user_id', 'rating', 'review_date'] }]
        });
        if (!period) return { status: 404, data: { error: true, message: "Period not found" } };
        return { status: 200, data: { error: false, message: "Period retrieved successfully", period } };
    } catch (error) {
        console.error('Error in getPeriodByIdService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const updatePeriodService = async (id, data, requestingUser) => {
    try {
        const canManage = await canManagePerformancePeriod(requestingUser);
        if (!canManage) {
            return { status: 403, data: { error: true, message: 'Only HR or senior manager can update performance periods' } };
        }

        const period = await PerformancePeriod.findByPk(id);
        if (!period) return { status: 404, data: { error: true, message: "Period not found" } };

        const allowed = ['period_name', 'start_date', 'end_date', 'status', 'description'];
        const updateData = {};
        Object.keys(data).forEach(key => { if (allowed.includes(key)) updateData[key] = data[key]; });

        await period.update(updateData);
        return { status: 200, data: { error: false, message: "Period updated successfully" } };
    } catch (error) {
        console.error('Error in updatePeriodService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const togglePeriodStatusService = async (id, requestingUser) => {
    try {
        const canManage = await canManagePerformancePeriod(requestingUser);
        if (!canManage) {
            return { status: 403, data: { error: true, message: 'Only HR or senior manager can change period status' } };
        }

        const period = await PerformancePeriod.findByPk(id);
        if (!period) return { status: 404, data: { error: true, message: "Period not found" } };

        const transitions = { planned: 'in_progress', in_progress: 'completed', completed: 'completed' };
        const newStatus = transitions[period.status];
        await period.update({ status: newStatus });
        return { status: 200, data: { error: false, message: `Period status changed to ${newStatus}`, period } };
    } catch (error) {
        console.error('Error in togglePeriodStatusService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};
