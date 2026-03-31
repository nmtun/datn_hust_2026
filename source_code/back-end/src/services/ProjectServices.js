import '../models/associations.js';
import { Op } from 'sequelize';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Department from '../models/Department.js';

const PROJECT_STATUSES = ['to_do', 'doing', 'review', 'done', 'on_hold', 'cancelled'];

const normalizeUserId = (context) => {
    if (context == null) return null;
    const raw = context.user_id ?? context.userId ?? context;
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? null : parsed;
};

const normalizeRole = (context) => {
    if (typeof context === 'string') return context;
    return context?.role ?? null;
};

const projectIncludes = [
    { model: User, as: 'manager', attributes: ['user_id', 'full_name', 'company_email'], required: false },
    { model: Department, as: 'department', attributes: ['department_id', 'name', 'code'], required: false }
];

const canViewProject = async (project, requestingUser) => {
    const role = normalizeRole(requestingUser);
    const userId = normalizeUserId(requestingUser);

    if (role === 'manager' || role === 'hr') return true;
    if (!userId || role !== 'employee') return false;

    if (Number(project.manager_id) === Number(userId)) return true;

    const linkedTask = await Task.findOne({
        where: {
            project_id: project.project_id,
            active: true,
            [Op.or]: [
                { assigned_to: userId },
                { created_by: userId }
            ]
        },
        attributes: ['task_id']
    });

    return Boolean(linkedTask);
};

const buildProjectWhere = async (query = {}, requestingUser = null) => {
    const where = { active: true };

    if (query.project_id) {
        where.project_id = Number(query.project_id);
    }

    if (query.department_id) {
        where.department_id = Number(query.department_id);
    }

    if (query.manager_id) {
        where.manager_id = Number(query.manager_id);
    }

    if (query.status) {
        where.status = query.status;
    }

    const role = normalizeRole(requestingUser);
    const userId = normalizeUserId(requestingUser);

    if (role === 'manager' || role === 'hr') {
        return where;
    }

    if (role !== 'employee' || !userId) {
        return { active: true, project_id: -1 };
    }

    const linkedTasks = await Task.findAll({
        where: {
            active: true,
            [Op.or]: [
                { assigned_to: userId },
                { created_by: userId }
            ]
        },
        attributes: ['project_id']
    });

    const projectIds = [...new Set(linkedTasks.map((item) => item.project_id).filter(Boolean))];
    if (projectIds.length === 0) {
        return { active: true, project_id: -1 };
    }

    if (where.project_id && !projectIds.includes(where.project_id)) {
        return { active: true, project_id: -1 };
    }

    where.project_id = where.project_id ? where.project_id : { [Op.in]: projectIds };
    return where;
};

export const createProjectService = async (data, requestingUser) => {
    try {
        const role = normalizeRole(requestingUser);
        const requestUserId = normalizeUserId(requestingUser);

        if (role !== 'manager') {
            return { status: 403, data: { error: true, message: 'Only manager can create projects' } };
        }

        const { name, goal, description, manager_id, department_id, start_date, end_date, status } = data;

        if (!name) {
            return { status: 400, data: { error: true, message: 'Project name is required' } };
        }

        if (status && !PROJECT_STATUSES.includes(status)) {
            return { status: 400, data: { error: true, message: 'Invalid project status' } };
        }

        const targetManagerId = manager_id ? Number(manager_id) : requestUserId;
        const manager = await User.findOne({
            where: {
                user_id: targetManagerId,
                role: 'manager',
                is_deleted: false
            },
            attributes: ['user_id']
        });

        if (!manager) {
            return { status: 404, data: { error: true, message: 'Manager not found' } };
        }

        if (department_id) {
            const department = await Department.findOne({
                where: { department_id: Number(department_id), active: true },
                attributes: ['department_id']
            });
            if (!department) {
                return { status: 404, data: { error: true, message: 'Department not found' } };
            }
        }

        const project = await Project.create({
            name,
            goal: goal || null,
            description: description || null,
            manager_id: targetManagerId,
            department_id: department_id ? Number(department_id) : null,
            start_date: start_date || null,
            end_date: end_date || null,
            status: status || 'to_do',
            active: true,
            created_at: new Date()
        });

        return { status: 201, data: { error: false, message: 'Project created successfully', project } };
    } catch (error) {
        console.error('Error in createProjectService:', error);
        return { status: 500, data: { error: true, message: 'Internal server error', details: error.message } };
    }
};

export const getAllProjectsService = async (query = {}, requestingUser) => {
    try {
        if (query.status && !PROJECT_STATUSES.includes(query.status)) {
            return { status: 400, data: { error: true, message: 'Invalid project status' } };
        }

        const where = await buildProjectWhere(query, requestingUser);

        const projects = await Project.findAll({
            where,
            include: projectIncludes,
            order: [['created_at', 'DESC']]
        });

        return { status: 200, data: { error: false, message: 'Projects retrieved successfully', projects } };
    } catch (error) {
        console.error('Error in getAllProjectsService:', error);
        return { status: 500, data: { error: true, message: 'Internal server error', details: error.message } };
    }
};

export const getProjectByIdService = async (id, requestingUser) => {
    try {
        const project = await Project.findOne({
            where: { project_id: Number(id), active: true },
            include: [
                ...projectIncludes,
                {
                    model: Task,
                    as: 'tasks',
                    required: false,
                    where: { active: true },
                    attributes: [
                        'task_id',
                        'title',
                        'status',
                        'priority',
                        'assigned_to',
                        'created_by',
                        'parent_task_id',
                        'due_date'
                    ]
                }
            ]
        });

        if (!project) {
            return { status: 404, data: { error: true, message: 'Project not found' } };
        }

        const canView = await canViewProject(project, requestingUser);
        if (!canView) {
            return { status: 403, data: { error: true, message: 'Access denied' } };
        }

        return { status: 200, data: { error: false, message: 'Project retrieved successfully', project } };
    } catch (error) {
        console.error('Error in getProjectByIdService:', error);
        return { status: 500, data: { error: true, message: 'Internal server error', details: error.message } };
    }
};

export const updateProjectService = async (id, data, requestingUser) => {
    try {
        const role = normalizeRole(requestingUser);
        if (role !== 'manager') {
            return { status: 403, data: { error: true, message: 'Only manager can update projects' } };
        }

        const project = await Project.findOne({
            where: { project_id: Number(id), active: true }
        });

        if (!project) {
            return { status: 404, data: { error: true, message: 'Project not found' } };
        }

        if (data.status && !PROJECT_STATUSES.includes(data.status)) {
            return { status: 400, data: { error: true, message: 'Invalid project status' } };
        }

        if (data.department_id) {
            const department = await Department.findOne({
                where: { department_id: Number(data.department_id), active: true },
                attributes: ['department_id']
            });
            if (!department) {
                return { status: 404, data: { error: true, message: 'Department not found' } };
            }
        }

        if (data.manager_id) {
            const manager = await User.findOne({
                where: {
                    user_id: Number(data.manager_id),
                    role: 'manager',
                    is_deleted: false
                },
                attributes: ['user_id']
            });

            if (!manager) {
                return { status: 404, data: { error: true, message: 'Manager not found' } };
            }
        }

        const allowedFields = ['name', 'goal', 'description', 'manager_id', 'department_id', 'start_date', 'end_date', 'status'];
        const updateData = {};
        Object.keys(data).forEach((key) => {
            if (allowedFields.includes(key)) {
                updateData[key] = data[key];
            }
        });

        if (updateData.status === 'done' && !updateData.end_date) {
            updateData.end_date = new Date();
        }

        updateData.updated_at = new Date();

        await project.update(updateData);

        return { status: 200, data: { error: false, message: 'Project updated successfully' } };
    } catch (error) {
        console.error('Error in updateProjectService:', error);
        return { status: 500, data: { error: true, message: 'Internal server error', details: error.message } };
    }
};

export const deleteProjectService = async (id, requestingUser) => {
    try {
        const role = normalizeRole(requestingUser);
        if (role !== 'manager') {
            return { status: 403, data: { error: true, message: 'Only manager can delete projects' } };
        }

        const project = await Project.findOne({
            where: { project_id: Number(id), active: true }
        });

        if (!project) {
            return { status: 404, data: { error: true, message: 'Project not found' } };
        }

        await project.update({ active: false, updated_at: new Date() });

        await Task.update(
            { active: false, updated_at: new Date() },
            { where: { project_id: Number(id), active: true } }
        );

        return { status: 200, data: { error: false, message: 'Project deleted successfully' } };
    } catch (error) {
        console.error('Error in deleteProjectService:', error);
        return { status: 500, data: { error: true, message: 'Internal server error', details: error.message } };
    }
};
