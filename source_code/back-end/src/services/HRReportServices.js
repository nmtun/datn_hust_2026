import '../models/associations.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import Performance from '../models/Performance.js';
import PerformancePeriod from '../models/PerformancePeriod.js';
import sequelize from '../config/dbsetup.js';
import { Op } from 'sequelize';

export const getEmployeeCountReportService = async () => {
    try {
        const counts = await User.findAll({
            where: { role: { [Op.in]: ['employee', 'manager', 'hr'] }, is_deleted: false },
            attributes: ['status', [sequelize.fn('COUNT', sequelize.col('user_id')), 'count']],
            group: ['status']
        });
        const total = await User.count({
            where: { role: { [Op.in]: ['employee', 'manager', 'hr'] }, is_deleted: false }
        });
        return { status: 200, data: { error: false, message: "Employee count report", counts, total } };
    } catch (error) {
        console.error('Error in getEmployeeCountReportService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const getEmployeesByDepartmentService = async () => {
    try {
        const departments = await Department.findAll({
            where: { active: true },
            attributes: ['department_id', 'name', 'code',
                [sequelize.literal(`(SELECT COUNT(*) FROM Employee_Info WHERE Employee_Info.department_id = Department.department_id)`), 'employee_count']
            ],
            order: [['name', 'ASC']]
        });
        return { status: 200, data: { error: false, message: "Employees by department report", departments } };
    } catch (error) {
        console.error('Error in getEmployeesByDepartmentService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const getTurnoverReportService = async (query = {}) => {
    try {
        const where = { status: 'terminated', is_deleted: false };
        if (query.from_date) where.updated_at = { [Op.gte]: new Date(query.from_date) };
        if (query.to_date) {
            where.updated_at = where.updated_at
                ? { ...where.updated_at, [Op.lte]: new Date(query.to_date) }
                : { [Op.lte]: new Date(query.to_date) };
        }

        const terminated = await User.findAll({
            where,
            attributes: { exclude: ['password'] },
            include: [{ model: Employee, as: 'Employee_Info', required: false }],
            order: [['updated_at', 'DESC']]
        });
        return { status: 200, data: { error: false, message: "Turnover report", terminated, count: terminated.length } };
    } catch (error) {
        console.error('Error in getTurnoverReportService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const getPerformanceSummaryService = async () => {
    try {
        const summary = await Performance.findAll({
            attributes: [
                'period_id',
                [sequelize.fn('AVG', sequelize.col('Performance.rating')), 'avg_rating'],
                [sequelize.fn('COUNT', sequelize.col('Performance.perf_id')), 'total_reviews'],
                [sequelize.fn('MIN', sequelize.col('Performance.rating')), 'min_rating'],
                [sequelize.fn('MAX', sequelize.col('Performance.rating')), 'max_rating']
            ],
            include: [{ model: PerformancePeriod, as: 'period', attributes: ['period_name', 'status'] }],
            group: ['period_id', 'period.period_id']
        });
        return { status: 200, data: { error: false, message: "Performance summary report", summary } };
    } catch (error) {
        console.error('Error in getPerformanceSummaryService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};
