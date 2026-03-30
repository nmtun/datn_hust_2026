import '../models/associations.js';
import { Op } from 'sequelize';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import TaskComment from '../models/TaskComment.js';
import TaskReview from '../models/TaskReview.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Team from '../models/Team.js';
import Department from '../models/Department.js';
import {
    getLedTeamIds,
    getEffectiveLedTeamIds,
    getManagedDepartmentIds,
    getManageableTeamIds,
    getMemberIdsForTeamLead,
    resolveHierarchyRole
} from './HierarchyServices.js';

const TASK_STATUSES = ['to_do', 'doing', 'review', 'done'];
const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const REVIEW_DECISIONS = ['approved', 'changes_requested'];

const TASK_STATUS_TRANSITIONS = {
    to_do: ['doing'],
    doing: ['review'],
    review: ['doing', 'done'],
    done: []
};

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

const toNumberOrNull = (value) => {
    if (value == null || value === '') return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};

const baseTaskIncludes = [
    { model: Project, as: 'project', attributes: ['project_id', 'name', 'status', 'manager_id'] },
    { model: Team, as: 'team', attributes: ['team_id', 'name', 'code', 'department_id'], required: false },
    { model: User, as: 'assignee', attributes: ['user_id', 'full_name', 'company_email'] },
    { model: User, as: 'creator', attributes: ['user_id', 'full_name', 'company_email'] },
    { model: Task, as: 'parentTask', attributes: ['task_id', 'title', 'status'], required: false }
];

const ensureProjectExists = async (projectId) => {
    return Project.findOne({
        where: {
            project_id: Number(projectId),
            active: true
        },
        attributes: ['project_id', 'name']
    });
};

const ensureTaskExists = async (taskId) => {
    return Task.findOne({
        where: {
            task_id: Number(taskId),
            active: true
        }
    });
};

const ensureAssigneeExists = async (userId) => {
    return User.findOne({
        where: {
            user_id: Number(userId),
            role: { [Op.in]: ['employee', 'manager', 'hr'] },
            is_deleted: false
        },
        attributes: ['user_id', 'role']
    });
};

const resolveUserHierarchyRole = async (user) => {
    if (!user) return null;

    if (user.role !== 'employee') {
        return user.role;
    }

    return resolveHierarchyRole({
        userId: user.user_id,
        role: user.role
    });
};

const getHierarchyRole = async (requestingUser) => {
    const role = normalizeRole(requestingUser);
    const userId = normalizeUserId(requestingUser);

    if (!role || !userId) return null;
    if (role !== 'employee') return role;

    return resolveHierarchyRole({ userId, role });
};

const resolveManagerOrHrTeamId = async (assigneeId, inputTeamId) => {
    if (inputTeamId) {
        const team = await Team.findOne({ where: { team_id: inputTeamId, active: true }, attributes: ['team_id'] });
        if (!team) {
            return { status: 404, message: 'Team not found' };
        }
        return { teamId: inputTeamId };
    }

    const employee = await Employee.findOne({
        where: { user_id: assigneeId },
        attributes: ['team_id']
    });

    return { teamId: employee?.team_id || null };
};

const resolveManagerDepartment = async (departmentId) => {
    if (!departmentId) return null;

    return Department.findOne({
        where: {
            department_id: Number(departmentId),
            active: true
        },
        attributes: ['department_id', 'manager_id']
    });
};

const validateAssignmentPermission = async ({ requestingUser, assigneeId, teamId, parentTask = null, departmentId = null }) => {
    const role = normalizeRole(requestingUser);
    const requesterId = normalizeUserId(requestingUser);

    if (!role || !requesterId) {
        return { status: 401, message: 'Invalid requester context' };
    }

    const assignee = await ensureAssigneeExists(assigneeId);
    if (!assignee) {
        return { status: 404, message: 'Assignee not found' };
    }

    const assigneeHierarchyRole = await resolveUserHierarchyRole(assignee);

    if (role === 'manager') {
        if (parentTask) {
            return { status: 403, message: 'Manager can only assign root tasks to department heads' };
        }

        if (teamId) {
            return { status: 400, message: 'Manager assigns task by department, not by team' };
        }

        if (!departmentId) {
            return { status: 400, message: 'department_id is required for manager assignment' };
        }

        const department = await resolveManagerDepartment(departmentId);
        if (!department) {
            return { status: 404, message: 'Department not found' };
        }

        if (!department.manager_id) {
            return { status: 400, message: 'Selected department does not have a department head' };
        }

        if (Number(department.manager_id) !== Number(assigneeId)) {
            return { status: 400, message: 'assigned_to must match selected department head' };
        }

        if (assigneeHierarchyRole !== 'department_head') {
            return { status: 403, message: 'Manager can only assign tasks to department heads' };
        }

        return { teamId: null };
    }

    if (role !== 'employee') {
        return { status: 403, message: 'Access denied' };
    }

    const hierarchyRole = await getHierarchyRole(requestingUser);

    if (hierarchyRole === 'department_head') {
        if (!parentTask) {
            return { status: 403, message: 'Department head must create sub tasks from assigned parent tasks' };
        }

        if (Number(parentTask.assigned_to) !== Number(requesterId)) {
            return { status: 403, message: 'Department head can only split tasks assigned to themselves' };
        }

        if (assigneeHierarchyRole !== 'team_lead') {
            return { status: 403, message: 'Department head can only assign tasks to team leads' };
        }

        const managedDepartmentIds = await getManagedDepartmentIds(requesterId);
        if (managedDepartmentIds.length === 0) {
            return { status: 403, message: 'You do not manage any department' };
        }

        const ledTeamIds = await getLedTeamIds(assigneeId, managedDepartmentIds);
        if (ledTeamIds.length === 0) {
            return {
                status: 403,
                message: 'Department head can only assign task to team leads in managed departments'
            };
        }

        if (teamId && !ledTeamIds.includes(Number(teamId))) {
            return { status: 400, message: 'team_id must match assignee team lead scope' };
        }

        return { teamId: teamId ? Number(teamId) : ledTeamIds[0] };
    }

    if (hierarchyRole === 'team_lead') {
        if (!parentTask) {
            return { status: 403, message: 'Team lead must create sub tasks from assigned parent tasks' };
        }

        if (Number(parentTask.assigned_to) !== Number(requesterId)) {
            return { status: 403, message: 'Team lead can only split tasks assigned to themselves' };
        }

        if (assigneeHierarchyRole !== 'employee') {
            return { status: 403, message: 'Team lead can only assign tasks to team members' };
        }

        const memberIds = await getMemberIdsForTeamLead(requesterId);
        if (!memberIds.includes(Number(assigneeId))) {
            return { status: 403, message: 'Team lead can only assign task to team members' };
        }

        const ledTeamIds = await getEffectiveLedTeamIds(requesterId);
        if (ledTeamIds.length === 0) {
            return { status: 403, message: 'You do not lead any team' };
        }

        if (teamId && !ledTeamIds.includes(Number(teamId))) {
            return { status: 400, message: 'team_id must belong to your led teams' };
        }

        if (teamId) {
            return { teamId: Number(teamId) };
        }

        const assigneeEmployee = await Employee.findOne({
            where: { user_id: Number(assigneeId) },
            attributes: ['team_id']
        });

        if (assigneeEmployee?.team_id && ledTeamIds.includes(assigneeEmployee.team_id)) {
            return { teamId: assigneeEmployee.team_id };
        }

        return { teamId: ledTeamIds[0] };
    }

    return { status: 403, message: 'Only department head or team lead can assign tasks' };
};

const canViewTask = async (task, requestingUser) => {
    const role = normalizeRole(requestingUser);
    const userId = normalizeUserId(requestingUser);

    if (role === 'manager' || role === 'hr') return true;
    if (!userId || role !== 'employee') return false;

    if (Number(task.assigned_to) === Number(userId) || Number(task.created_by) === Number(userId)) {
        return true;
    }

    const manageableTeamIds = await getManageableTeamIds({ userId, role });
    return manageableTeamIds.includes(task.team_id);
};

const canEditTask = async (task, requestingUser) => {
    const role = normalizeRole(requestingUser);
    const userId = normalizeUserId(requestingUser);

    if (role === 'manager' || role === 'hr') return true;
    if (!userId || role !== 'employee') return false;

    return Number(task.created_by) === Number(userId);
};

const canReviewTask = async (task, requestingUser) => {
    const role = normalizeRole(requestingUser);
    const reviewerId = normalizeUserId(requestingUser);

    if (!role || !reviewerId) return false;

    if (role === 'manager' || role === 'hr') {
        return Number(task.assigned_to) !== Number(reviewerId);
    }

    if (role !== 'employee') return false;

    const hierarchyRole = await getHierarchyRole(requestingUser);

    if (hierarchyRole === 'department_head') {
        if (Number(task.assigned_to) === Number(reviewerId)) return false;

        const managedDepartmentIds = await getManagedDepartmentIds(reviewerId);
        if (managedDepartmentIds.length === 0) return false;

        const ledTeamIds = await getLedTeamIds(task.assigned_to, managedDepartmentIds);
        return ledTeamIds.length > 0;
    }

    if (hierarchyRole === 'team_lead') {
        if (Number(task.assigned_to) === Number(reviewerId)) return false;

        const memberIds = await getMemberIdsForTeamLead(reviewerId);
        return memberIds.includes(Number(task.assigned_to));
    }

    return false;
};

const buildTaskWhere = async (query = {}, requestingUser) => {
    const where = { active: true };

    if (query.project_id) where.project_id = Number(query.project_id);
    if (query.assigned_to) where.assigned_to = Number(query.assigned_to);
    if (query.created_by) where.created_by = Number(query.created_by);
    if (query.team_id) where.team_id = Number(query.team_id);

    if (query.status) {
        where.status = query.status;
    }

    if (query.parent_task_id === 'null') {
        where.parent_task_id = null;
    } else if (query.parent_task_id) {
        where.parent_task_id = Number(query.parent_task_id);
    }

    const role = normalizeRole(requestingUser);
    const userId = normalizeUserId(requestingUser);

    if (role === 'manager' || role === 'hr') {
        return where;
    }

    if (role !== 'employee' || !userId) {
        return { active: true, task_id: -1 };
    }

    const manageableTeamIds = await getManageableTeamIds({ userId, role });
    const visibilityClauses = [
        { assigned_to: userId },
        { created_by: userId }
    ];

    if (manageableTeamIds.length > 0) {
        visibilityClauses.push({ team_id: { [Op.in]: manageableTeamIds } });
    }

    where[Op.or] = visibilityClauses;
    return where;
};

export const createTaskService = async (data, requestingUser) => {
    try {
        const requesterId = normalizeUserId(requestingUser);

        if (!requesterId) {
            return { status: 401, data: { error: true, message: 'Invalid requester context' } };
        }

        const { title, description, project_id, assigned_to, parent_task_id, due_date, priority, status, start_date, team_id, department_id } = data;

        if (!title) {
            return { status: 400, data: { error: true, message: 'Task title is required' } };
        }

        const projectId = toNumberOrNull(project_id);
        const assigneeId = toNumberOrNull(assigned_to);
        const parentTaskId = toNumberOrNull(parent_task_id);
        const inputTeamId = toNumberOrNull(team_id);

        if (!projectId) {
            return { status: 400, data: { error: true, message: 'project_id is required' } };
        }

        if (!assigneeId) {
            return { status: 400, data: { error: true, message: 'assigned_to is required' } };
        }

        if (status && !TASK_STATUSES.includes(status)) {
            return { status: 400, data: { error: true, message: 'Invalid task status' } };
        }

        if (priority && !TASK_PRIORITIES.includes(priority)) {
            return { status: 400, data: { error: true, message: 'Invalid task priority' } };
        }

        const project = await ensureProjectExists(projectId);
        if (!project) {
            return { status: 404, data: { error: true, message: 'Project not found' } };
        }

        let parentTask = null;
        if (parentTaskId) {
            parentTask = await ensureTaskExists(parentTaskId);
            if (!parentTask) {
                return { status: 404, data: { error: true, message: 'Parent task not found' } };
            }

            if (Number(parentTask.project_id) !== Number(projectId)) {
                return { status: 400, data: { error: true, message: 'Parent task must belong to the same project' } };
            }
        }

        const permission = await validateAssignmentPermission({
            requestingUser,
            assigneeId,
            teamId: inputTeamId,
            parentTask,
            departmentId: toNumberOrNull(department_id)
        });

        if (permission.status) {
            return { status: permission.status, data: { error: true, message: permission.message } };
        }

        let resolvedTeamId = permission.teamId ?? null;
        if (!resolvedTeamId && parentTask?.team_id) {
            resolvedTeamId = parentTask.team_id;
        }

        const task = await Task.create({
            project_id: projectId,
            parent_task_id: parentTaskId,
            team_id: resolvedTeamId,
            title,
            description: description || null,
            assigned_to: assigneeId,
            created_by: requesterId,
            start_date: start_date || new Date(),
            due_date: due_date || null,
            completed_date: null,
            status: status || 'to_do',
            priority: priority || 'medium',
            active: true,
            created_at: new Date()
        });

        return { status: 201, data: { error: false, message: 'Task created successfully', task } };
    } catch (error) {
        console.error('Error in createTaskService:', error);
        return { status: 500, data: { error: true, message: 'Internal server error', details: error.message } };
    }
};

export const getAllTasksService = async (query = {}, requestingUser) => {
    try {
        if (query.status && !TASK_STATUSES.includes(query.status)) {
            return { status: 400, data: { error: true, message: 'Invalid task status' } };
        }

        const where = await buildTaskWhere(query, requestingUser);

        const tasks = await Task.findAll({
            where,
            include: baseTaskIncludes,
            order: [['created_at', 'DESC']]
        });

        return { status: 200, data: { error: false, message: 'Tasks retrieved successfully', tasks } };
    } catch (error) {
        console.error('Error in getAllTasksService:', error);
        return { status: 500, data: { error: true, message: 'Internal server error', details: error.message } };
    }
};

export const getTaskByIdService = async (id, requestingUser) => {
    try {
        const task = await Task.findOne({
            where: {
                task_id: Number(id),
                active: true
            },
            include: [
                ...baseTaskIncludes,
                {
                    model: TaskComment,
                    as: 'comments',
                    required: false,
                    include: [
                        { model: User, as: 'author', attributes: ['user_id', 'full_name', 'company_email'] }
                    ]
                },
                {
                    model: TaskReview,
                    as: 'reviews',
                    required: false,
                    include: [
                        { model: User, as: 'reviewer', attributes: ['user_id', 'full_name', 'company_email'] },
                        { model: User, as: 'reviewedUser', attributes: ['user_id', 'full_name', 'company_email'] }
                    ]
                },
                {
                    model: Task,
                    as: 'subTasks',
                    required: false,
                    where: { active: true },
                    include: [
                        { model: User, as: 'assignee', attributes: ['user_id', 'full_name', 'company_email'] }
                    ]
                }
            ],
            order: [
                [{ model: TaskComment, as: 'comments' }, 'created_at', 'ASC'],
                [{ model: TaskReview, as: 'reviews' }, 'created_at', 'DESC'],
                [{ model: Task, as: 'subTasks' }, 'created_at', 'DESC']
            ]
        });

        if (!task) {
            return { status: 404, data: { error: true, message: 'Task not found' } };
        }

        const canView = await canViewTask(task, requestingUser);
        if (!canView) {
            return { status: 403, data: { error: true, message: 'Access denied' } };
        }

        return { status: 200, data: { error: false, message: 'Task retrieved successfully', task } };
    } catch (error) {
        console.error('Error in getTaskByIdService:', error);
        return { status: 500, data: { error: true, message: 'Internal server error', details: error.message } };
    }
};

export const updateTaskService = async (id, data, requestingUser) => {
    try {
        const task = await ensureTaskExists(id);
        if (!task) {
            return { status: 404, data: { error: true, message: 'Task not found' } };
        }

        const canEdit = await canEditTask(task, requestingUser);
        if (!canEdit) {
            return { status: 403, data: { error: true, message: 'Only task creator or manager can update task metadata' } };
        }

        if (data.priority && !TASK_PRIORITIES.includes(data.priority)) {
            return { status: 400, data: { error: true, message: 'Invalid task priority' } };
        }

        if (data.project_id && Number(data.project_id) !== Number(task.project_id)) {
            return { status: 400, data: { error: true, message: 'Changing project_id is not supported' } };
        }

        const updateData = {};
        const allowedFields = ['title', 'description', 'start_date', 'due_date', 'priority'];

        allowedFields.forEach((field) => {
            if (field in data) {
                updateData[field] = data[field];
            }
        });

        let nextAssigneeId = Number(task.assigned_to);
        if ('assigned_to' in data) {
            const parsedAssignee = toNumberOrNull(data.assigned_to);
            if (!parsedAssignee) {
                return { status: 400, data: { error: true, message: 'assigned_to is invalid' } };
            }
            nextAssigneeId = parsedAssignee;
        }

        let nextDepartmentId = null;
        if ('department_id' in data) {
            nextDepartmentId = toNumberOrNull(data.department_id);
        }

        let nextTeamId = task.team_id;
        if ('team_id' in data) {
            nextTeamId = toNumberOrNull(data.team_id);
        }

        let targetParentTask = null;
        if ('parent_task_id' in data) {
            const parentTaskId = toNumberOrNull(data.parent_task_id);
            if (!parentTaskId) {
                updateData.parent_task_id = null;
            } else {
                const parentTask = await ensureTaskExists(parentTaskId);
                if (!parentTask) {
                    return { status: 404, data: { error: true, message: 'Parent task not found' } };
                }

                if (Number(parentTask.project_id) !== Number(task.project_id)) {
                    return { status: 400, data: { error: true, message: 'Parent task must belong to the same project' } };
                }

                if (Number(parentTask.task_id) === Number(task.task_id)) {
                    return { status: 400, data: { error: true, message: 'Task cannot be parent of itself' } };
                }

                updateData.parent_task_id = parentTaskId;
                targetParentTask = parentTask;
            }
        } else if (task.parent_task_id) {
            targetParentTask = await ensureTaskExists(task.parent_task_id);
        }

        const shouldValidateDelegation = 'assigned_to' in data || 'team_id' in data || 'parent_task_id' in data;

        if (shouldValidateDelegation) {
            const permission = await validateAssignmentPermission({
                requestingUser,
                assigneeId: nextAssigneeId,
                teamId: nextTeamId,
                parentTask: targetParentTask,
                departmentId: nextDepartmentId
            });

            if (permission.status) {
                return { status: permission.status, data: { error: true, message: permission.message } };
            }

            updateData.assigned_to = nextAssigneeId;
            updateData.team_id = permission.teamId ?? null;
        }

        updateData.updated_at = new Date();

        await task.update(updateData);

        return { status: 200, data: { error: false, message: 'Task updated successfully' } };
    } catch (error) {
        console.error('Error in updateTaskService:', error);
        return { status: 500, data: { error: true, message: 'Internal server error', details: error.message } };
    }
};

export const deleteTaskService = async (id, requestingUser) => {
    try {
        const task = await ensureTaskExists(id);
        if (!task) {
            return { status: 404, data: { error: true, message: 'Task not found' } };
        }

        const canEdit = await canEditTask(task, requestingUser);
        if (!canEdit) {
            return { status: 403, data: { error: true, message: 'Only task creator or manager can delete task' } };
        }

        const now = new Date();

        await task.update({ active: false, updated_at: now });
        await Task.update(
            { active: false, updated_at: now },
            { where: { parent_task_id: Number(id), active: true } }
        );

        return { status: 200, data: { error: false, message: 'Task deleted successfully' } };
    } catch (error) {
        console.error('Error in deleteTaskService:', error);
        return { status: 500, data: { error: true, message: 'Internal server error', details: error.message } };
    }
};

export const updateTaskStatusService = async (id, status, requestingUser) => {
    try {
        const task = await ensureTaskExists(id);
        if (!task) {
            return { status: 404, data: { error: true, message: 'Task not found' } };
        }

        if (!TASK_STATUSES.includes(status)) {
            return { status: 400, data: { error: true, message: 'Invalid task status' } };
        }

        const role = normalizeRole(requestingUser);
        const userId = normalizeUserId(requestingUser);

        const isPrivileged = role === 'manager' || role === 'hr';
        const isOwner = Number(task.created_by) === Number(userId) || Number(task.assigned_to) === Number(userId);

        if (!isPrivileged && !isOwner) {
            return { status: 403, data: { error: true, message: 'Only task assignee/creator can update task status' } };
        }

        if (status !== task.status && !TASK_STATUS_TRANSITIONS[task.status].includes(status)) {
            return {
                status: 400,
                data: {
                    error: true,
                    message: `Invalid status transition from ${task.status} to ${status}`
                }
            };
        }

        const updateData = {
            status,
            updated_at: new Date()
        };

        if (status === 'done') {
            updateData.completed_date = new Date();
        } else if (task.completed_date) {
            updateData.completed_date = null;
        }

        await task.update(updateData);

        return { status: 200, data: { error: false, message: 'Task status updated successfully', status } };
    } catch (error) {
        console.error('Error in updateTaskStatusService:', error);
        return { status: 500, data: { error: true, message: 'Internal server error', details: error.message } };
    }
};

export const addTaskCommentService = async (taskId, data, requestingUser) => {
    try {
        const task = await ensureTaskExists(taskId);
        if (!task) {
            return { status: 404, data: { error: true, message: 'Task not found' } };
        }

        const canView = await canViewTask(task, requestingUser);
        if (!canView) {
            return { status: 403, data: { error: true, message: 'Access denied' } };
        }

        const commentText = data?.comment?.trim();
        if (!commentText) {
            return { status: 400, data: { error: true, message: 'comment is required' } };
        }

        const comment = await TaskComment.create({
            task_id: Number(taskId),
            user_id: normalizeUserId(requestingUser),
            comment: commentText,
            created_at: new Date()
        });

        return { status: 201, data: { error: false, message: 'Comment added successfully', comment } };
    } catch (error) {
        console.error('Error in addTaskCommentService:', error);
        return { status: 500, data: { error: true, message: 'Internal server error', details: error.message } };
    }
};

export const getTaskCommentsService = async (taskId, requestingUser) => {
    try {
        const task = await ensureTaskExists(taskId);
        if (!task) {
            return { status: 404, data: { error: true, message: 'Task not found' } };
        }

        const canView = await canViewTask(task, requestingUser);
        if (!canView) {
            return { status: 403, data: { error: true, message: 'Access denied' } };
        }

        const comments = await TaskComment.findAll({
            where: { task_id: Number(taskId) },
            include: [
                { model: User, as: 'author', attributes: ['user_id', 'full_name', 'company_email'] }
            ],
            order: [['created_at', 'ASC']]
        });

        return { status: 200, data: { error: false, message: 'Comments retrieved successfully', comments } };
    } catch (error) {
        console.error('Error in getTaskCommentsService:', error);
        return { status: 500, data: { error: true, message: 'Internal server error', details: error.message } };
    }
};

export const createTaskReviewService = async (taskId, data, requestingUser) => {
    try {
        const task = await ensureTaskExists(taskId);
        if (!task) {
            return { status: 404, data: { error: true, message: 'Task not found' } };
        }

        if (task.status !== 'review') {
            return { status: 400, data: { error: true, message: 'Task must be in review status before reviewing' } };
        }

        const decision = data?.decision;
        if (!REVIEW_DECISIONS.includes(decision)) {
            return { status: 400, data: { error: true, message: 'decision must be approved or changes_requested' } };
        }

        const allowedToReview = await canReviewTask(task, requestingUser);
        if (!allowedToReview) {
            return { status: 403, data: { error: true, message: 'You do not have permission to review this task' } };
        }

        const review = await TaskReview.create({
            task_id: Number(taskId),
            reviewer_id: normalizeUserId(requestingUser),
            reviewed_user_id: task.assigned_to,
            decision,
            note: data?.note || null,
            created_at: new Date()
        });

        const nextStatus = decision === 'approved' ? 'done' : 'doing';
        const updateData = {
            status: nextStatus,
            updated_at: new Date(),
            completed_date: nextStatus === 'done' ? new Date() : null
        };

        await task.update(updateData);

        return {
            status: 201,
            data: {
                error: false,
                message: 'Task review submitted successfully',
                review,
                task_status: nextStatus
            }
        };
    } catch (error) {
        console.error('Error in createTaskReviewService:', error);
        return { status: 500, data: { error: true, message: 'Internal server error', details: error.message } };
    }
};
