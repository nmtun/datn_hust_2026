import '../models/associations.js';
import { Op } from 'sequelize';
import Performance from '../models/Performance.js';
import PerformancePeriod from '../models/PerformancePeriod.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import Team from '../models/Team.js';
import { getEvaluationTargetUserIds, getManagementTargetUserIds, resolveHierarchyRole } from './HierarchyServices.js';

const employeeAttributes = ['user_id', 'full_name', 'company_email'];

const getUserById = async (userId) => {
    return User.findOne({ where: { user_id: userId, is_deleted: false } });
};

export const createPerformanceService = async (data, reviewerUser) => {
    try {
        const { user_id, period_id, kpi_goals, achievement, rating, feedback, review_date, visibility } = data;
        if (!user_id || !period_id || !review_date) {
            return { status: 400, data: { error: true, message: "user_id, period_id and review_date are required" } };
        }

        if (visibility && !['private', 'shared_with_employee'].includes(visibility)) {
            return { status: 400, data: { error: true, message: "visibility must be private or shared_with_employee" } };
        }

        const reviewerId = reviewerUser.user_id;

        if (Number(user_id) === Number(reviewerId)) {
            return { status: 400, data: { error: true, message: "You cannot review yourself" } };
        }

        const targetUser = await getUserById(user_id);
        if (!targetUser) {
            return { status: 404, data: { error: true, message: "Employee not found" } };
        }

        if (targetUser.role === 'candidate') {
            return { status: 400, data: { error: true, message: "Candidate cannot be reviewed in performance module" } };
        }

        if (reviewerUser.role !== 'hr') {
            const evaluableIds = await getEvaluationTargetUserIds(reviewerUser);
            if (!evaluableIds.includes(Number(user_id))) {
                return {
                    status: 403,
                    data: {
                        error: true,
                        message: "You do not have permission to evaluate this employee"
                    }
                };
            }
        }

        const perf = await Performance.create({
            user_id, period_id, kpi_goals, achievement, rating: rating || 0,
            feedback,
            visibility: visibility || 'shared_with_employee',
            review_date,
            reviewer_id: reviewerId,
            created_at: new Date()
        });
        return { status: 201, data: { error: false, message: "Performance record created successfully", performance: perf } };
    } catch (error) {
        console.error('Error in createPerformanceService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const getAllPerformanceServiceOfManager = async ({ requestingUser }) => {
    try {
        let where;

        if (requestingUser.role === 'hr') {
            where = undefined;
        } else {
            const hierarchyRole = await resolveHierarchyRole({
                userId: requestingUser.user_id,
                role: requestingUser.role
            });

            const canReview =
                requestingUser.role === 'manager' ||
                hierarchyRole === 'department_head' ||
                hierarchyRole === 'team_lead';

            if (!canReview) {
                return { status: 403, data: { error: true, message: 'Access denied' } };
            }

            const evaluableIds = await getEvaluationTargetUserIds(requestingUser);
            if (evaluableIds.length === 0) {
                return { status: 200, data: { error: false, message: "No evaluable employees found", records: [] } };
            }

            where = {
                reviewer_id: requestingUser.user_id,
                user_id: { [Op.in]: evaluableIds }
            };
        }

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

        if (requestingUser.role === 'hr') {
            return { status: 200, data: { error: false, message: "Performance record retrieved", performance: perf } };
        }

        const isReviewer = Number(perf.reviewer_id) === Number(requestingUser.user_id);
        const isOwner = Number(perf.user_id) === Number(requestingUser.user_id);
        const isSharedWithEmployee = perf.visibility === 'shared_with_employee';

        if (isReviewer || (isOwner && isSharedWithEmployee)) {
            return { status: 200, data: { error: false, message: "Performance record retrieved", performance: perf } };
        }

        return { status: 403, data: { error: true, message: "Access denied" } };
    } catch (error) {
        console.error('Error in getPerformanceByIdService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const updatePerformanceService = async (id, data, requestingUser) => {
    try {
        const perf = await Performance.findByPk(id);
        if (!perf) return { status: 404, data: { error: true, message: "Performance record not found" } };

        if (requestingUser.role !== 'hr' && Number(perf.reviewer_id) !== Number(requestingUser.user_id)) {
            return { status: 403, data: { error: true, message: "You can only update reviews you created" } };
        }

        if (requestingUser.role !== 'hr') {
            const evaluableIds = await getEvaluationTargetUserIds(requestingUser);
            if (!evaluableIds.includes(Number(perf.user_id))) {
                return { status: 403, data: { error: true, message: "You no longer have permission to update this review" } };
            }
        }

        if (data.visibility && !['private', 'shared_with_employee'].includes(data.visibility)) {
            return { status: 400, data: { error: true, message: "visibility must be private or shared_with_employee" } };
        }

        const allowed = ['kpi_goals', 'achievement', 'rating', 'feedback', 'review_date', 'visibility'];
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
            where: {
                user_id: userId,
                visibility: 'shared_with_employee'
            },
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

export const getTeamPerformanceService = async (requestingUser) => {
    try {
        const userIds = await getManagementTargetUserIds(requestingUser);

        if (userIds.length === 0) {
            return { status: 200, data: { error: false, message: "No team members found", records: [] } };
        }

        const records = await Performance.findAll({
            where: {
                user_id: userIds,
                reviewer_id: requestingUser.user_id
            },
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

export const getEvaluableEmployeesService = async (requestingUser) => {
    try {
        const hierarchyRole = await resolveHierarchyRole({
            userId: requestingUser.user_id,
            role: requestingUser.role
        });

        const userIds = await getEvaluationTargetUserIds(requestingUser);

        if (userIds.length === 0) {
            return {
                status: 200,
                data: {
                    error: false,
                    message: 'No evaluable employees found',
                    hierarchy_role: hierarchyRole,
                    employees: []
                }
            };
        }

        const employees = await User.findAll({
            where: {
                user_id: { [Op.in]: userIds },
                is_deleted: false
            },
            attributes: ['user_id', 'full_name', 'company_email', 'role'],
            include: [
                {
                    model: Employee,
                    as: 'Employee_Info',
                    required: false,
                    attributes: ['department_id', 'team_id', 'manager_id', 'position'],
                    include: [
                        { model: Department, as: 'department', attributes: ['department_id', 'name', 'code'], required: false },
                        { model: Team, as: 'team', attributes: ['team_id', 'name', 'code'], required: false }
                    ]
                }
            ],
            order: [['full_name', 'ASC']]
        });

        return {
            status: 200,
            data: {
                error: false,
                message: 'Evaluable employees retrieved successfully',
                hierarchy_role: hierarchyRole,
                employees
            }
        };
    } catch (error) {
        console.error('Error in getEvaluableEmployeesService:', error);
        return { status: 500, data: { error: true, message: 'Internal server error', details: error.message } };
    }
};
