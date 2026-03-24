import '../models/associations.js';
import Performance from '../models/Performance.js';
import PerformancePeriod from '../models/PerformancePeriod.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';

const employeeAttributes = ['user_id', 'full_name', 'company_email'];

export const createPerformanceService = async (data, reviewerId) => {
    try {
        const { user_id, period_id, kpi_goals, achievement, rating, feedback, review_date } = data;
        if (!user_id || !period_id || !review_date) {
            return { status: 400, data: { error: true, message: "user_id, period_id and review_date are required" } };
        }
        const perf = await Performance.create({
            user_id, period_id, kpi_goals, achievement, rating: rating || 0,
            feedback, review_date, reviewer_id: reviewerId, created_at: new Date()
        });
        return { status: 201, data: { error: false, message: "Performance record created successfully", performance: perf } };
    } catch (error) {
        console.error('Error in createPerformanceService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const getAllPerformanceServiceOfManager = async ({ managerId, role }) => {
    try {
        const where = role === 'manager' ? { reviewer_id: managerId } : undefined;

        const records = await Performance.findAll({
            where,
            include: [
                { model: User, as: 'employee', attributes: employeeAttributes },
                { model: User, as: 'reviewer', attributes: employeeAttributes },
                { model: PerformancePeriod, as: 'period', attributes: ['period_id', 'period_name', 'status'] }
            ],
            order: [['created_at', 'DESC']]
        });
        return { status: 200, data: { error: false, message: "All performance records retrieved", records } };
    } catch (error) {
        console.error('Error in getAllPerformanceServiceOfManager:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const getPerformanceByIdService = async (id, requestingUser) => {
    try {
        const perf = await Performance.findByPk(id, {
            include: [
                { model: User, as: 'employee', attributes: employeeAttributes },
                { model: User, as: 'reviewer', attributes: employeeAttributes },
                { model: PerformancePeriod, as: 'period' }
            ]
        });
        if (!perf) return { status: 404, data: { error: true, message: "Performance record not found" } };

        // Authorization check
        if (requestingUser.role === 'employee' && perf.user_id !== requestingUser.user_id) {
            return { status: 403, data: { error: true, message: "Access denied" } };
        }
        if (requestingUser.role === 'manager') {
            const isTeamMember = await Employee.findOne({ where: { user_id: perf.user_id, manager_id: requestingUser.user_id } });
            if (!isTeamMember && perf.user_id !== requestingUser.user_id) {
                return { status: 403, data: { error: true, message: "Access denied" } };
            }
        }
        return { status: 200, data: { error: false, message: "Performance record retrieved", performance: perf } };
    } catch (error) {
        console.error('Error in getPerformanceByIdService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const updatePerformanceService = async (id, data, requestingUser) => {
    try {
        const perf = await Performance.findByPk(id);
        if (!perf) return { status: 404, data: { error: true, message: "Performance record not found" } };

        // Manager can only update reviews they created
        if (requestingUser.role === 'manager' && perf.reviewer_id !== requestingUser.user_id) {
            return { status: 403, data: { error: true, message: "You can only update reviews you created" } };
        }

        const allowed = ['kpi_goals', 'achievement', 'rating', 'feedback', 'review_date'];
        const updateData = {};
        Object.keys(data).forEach(key => { if (allowed.includes(key)) updateData[key] = data[key]; });
        updateData.updated_at = new Date();

        await perf.update(updateData);
        return { status: 200, data: { error: false, message: "Performance record updated successfully" } };
    } catch (error) {
        console.error('Error in updatePerformanceService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const getMyPerformanceService = async (userId) => {
    try {
        const records = await Performance.findAll({
            where: { user_id: userId },
            include: [
                { model: User, as: 'reviewer', attributes: employeeAttributes },
                { model: PerformancePeriod, as: 'period' }
            ],
            order: [['review_date', 'DESC']]
        });
        return { status: 200, data: { error: false, message: "My performance records retrieved", records } };
    } catch (error) {
        console.error('Error in getMyPerformanceService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const getTeamPerformanceService = async (managerId) => {
    try {
        const teamMembers = await Employee.findAll({ where: { manager_id: managerId }, attributes: ['user_id'] });
        const userIds = teamMembers.map(e => e.user_id);

        if (userIds.length === 0) {
            return { status: 200, data: { error: false, message: "No team members found", records: [] } };
        }

        const records = await Performance.findAll({
            where: { user_id: userIds },
            include: [
                { model: User, as: 'employee', attributes: employeeAttributes },
                { model: User, as: 'reviewer', attributes: employeeAttributes },
                { model: PerformancePeriod, as: 'period', attributes: ['period_id', 'period_name', 'status'] }
            ],
            order: [['review_date', 'DESC']]
        });
        return { status: 200, data: { error: false, message: "Team performance retrieved", records } };
    } catch (error) {
        console.error('Error in getTeamPerformanceService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};
