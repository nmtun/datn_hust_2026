import '../models/associations.js';
import { Op } from 'sequelize';
import Department from '../models/Department.js';
import Team from '../models/Team.js';
import Employee from '../models/Employee.js';
import User from '../models/User.js';

const departmentIncludes = [
    { model: User, as: 'manager', attributes: ['user_id', 'full_name', 'company_email'] },
    { model: Department, as: 'parentDepartment', attributes: ['department_id', 'name', 'code'] },
    { model: Team, as: 'teams', attributes: ['team_id', 'name', 'code', 'active'], where: { active: true }, required: false }
];

const canMutateDepartment = async (requestingUser) => {
    if (!requestingUser) return false;
    if (requestingUser.role === 'hr') return true;
    return requestingUser.role === 'manager';
};

const getDepartmentScopeWhere = async (requestingUser) => {
    const where = { active: true };

    if (!requestingUser) return where;

    if (requestingUser.role === 'hr' || requestingUser.role === 'employee' || requestingUser.role === 'manager') {
        return where;
    }

    return { active: true, department_id: -1 };
};

export const createDepartmentService = async (data, requestingUser) => {
    try {
        const { name, code, description, manager_id, parent_department_id } = data;
        if (!name) return { status: 400, data: { error: true, message: "Department name is required" } };
        if (!code) return { status: 400, data: { error: true, message: "Department code is required" } };

        const canMutate = await canMutateDepartment(requestingUser);
        if (!canMutate) {
            return { status: 403, data: { error: true, message: 'Only HR or manager can manage departments' } };
        }

        const existing = await Department.findOne({ where: { code } });
        if (existing) return { status: 400, data: { error: true, message: "Department code already exists" } };

        const department = await Department.create({
            name, code, description, manager_id: manager_id || null,
            parent_department_id: parent_department_id || null,
            active: true,
            created_at: new Date()
        });

        if (manager_id) {
            const managerUpdate = { department_id: department.department_id };
            if (requestingUser.role === 'manager') {
                managerUpdate.manager_id = requestingUser.user_id;
            }

            await Employee.update(managerUpdate, { where: { user_id: manager_id } });
        }

        return { status: 201, data: { error: false, message: "Department created successfully", department } };
    } catch (error) {
        console.error('Error in createDepartmentService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const getAllDepartmentsService = async (requestingUser = null) => {
    try {
        const where = await getDepartmentScopeWhere(requestingUser);

        const departments = await Department.findAll({
            where,
            include: departmentIncludes,
            order: [['name', 'ASC']]
        });
        return { status: 200, data: { error: false, message: "Departments retrieved successfully", departments } };
    } catch (error) {
        console.error('Error in getAllDepartmentsService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const getDepartmentByIdService = async (id, requestingUser = null) => {
    try {
        const department = await Department.findOne({
            where: { department_id: id },
            include: [
                { model: User, as: 'manager', attributes: ['user_id', 'full_name', 'company_email'] },
                { model: Department, as: 'parentDepartment', attributes: ['department_id', 'name', 'code'] },
                { model: Department, as: 'subDepartments', attributes: ['department_id', 'name', 'code', 'active'] },
                { model: Team, as: 'teams', where: { active: true }, required: false }
            ]
        });
        if (!department) return { status: 404, data: { error: true, message: "Department not found" } };

        if (requestingUser) {
            const scopeWhere = await getDepartmentScopeWhere(requestingUser);
            if (scopeWhere.department_id === -1) {
                return { status: 403, data: { error: true, message: 'Access denied' } };
            }

            if (scopeWhere.manager_id && scopeWhere.manager_id !== department.manager_id) {
                return { status: 403, data: { error: true, message: 'Access denied' } };
            }

            if (scopeWhere.department_id && typeof scopeWhere.department_id === 'object' && scopeWhere.department_id[Op.in]) {
                if (!scopeWhere.department_id[Op.in].includes(Number(id))) {
                    return { status: 403, data: { error: true, message: 'Access denied' } };
                }
            }
        }

        return { status: 200, data: { error: false, message: "Department retrieved successfully", department } };
    } catch (error) {
        console.error('Error in getDepartmentByIdService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const updateDepartmentService = async (id, data, requestingUser) => {
    try {
        const department = await Department.findOne({ where: { department_id: id } });
        if (!department) return { status: 404, data: { error: true, message: "Department not found" } };

        const canMutate = await canMutateDepartment(requestingUser);
        if (!canMutate) {
            return { status: 403, data: { error: true, message: 'Only HR or manager can manage departments' } };
        }

        const allowed = ['name', 'code', 'description', 'manager_id', 'parent_department_id', 'active'];
        const updateData = {};
        Object.keys(data).forEach(key => {
            if (allowed.includes(key)) updateData[key] = data[key];
        });
        updateData.updated_at = new Date();

        await department.update(updateData);

        if ('manager_id' in updateData && updateData.manager_id) {
            const managerUpdate = { department_id: Number(id) };
            if (requestingUser.role === 'manager') {
                managerUpdate.manager_id = requestingUser.user_id;
            }

            await Employee.update(managerUpdate, { where: { user_id: updateData.manager_id } });

            const teams = await Team.findAll({
                where: {
                    department_id: Number(id),
                    active: true,
                    leader_id: { [Op.ne]: null }
                },
                attributes: ['leader_id']
            });

            const teamLeaderIds = [...new Set(teams.map((team) => team.leader_id).filter(Boolean))];
            if (teamLeaderIds.length > 0) {
                await Employee.update(
                    { manager_id: updateData.manager_id },
                    { where: { user_id: { [Op.in]: teamLeaderIds } } }
                );
            }
        }

        return { status: 200, data: { error: false, message: "Department updated successfully" } };
    } catch (error) {
        console.error('Error in updateDepartmentService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const deleteDepartmentService = async (id, requestingUser) => {
    try {
        const department = await Department.findOne({ where: { department_id: id } });
        if (!department) return { status: 404, data: { error: true, message: "Department not found" } };

        const canMutate = await canMutateDepartment(requestingUser);
        if (!canMutate) {
            return { status: 403, data: { error: true, message: 'Only HR or manager can manage departments' } };
        }

        await department.update({ active: false, updated_at: new Date() });
        return { status: 200, data: { error: false, message: "Department disabled successfully" } };
    } catch (error) {
        console.error('Error in deleteDepartmentService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};
