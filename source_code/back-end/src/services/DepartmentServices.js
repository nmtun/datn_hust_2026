import '../models/associations.js';
import Department from '../models/Department.js';
import Team from '../models/Team.js';
import Employee from '../models/Employee.js';
import User from '../models/User.js';

export const createDepartmentService = async (data) => {
    try {
        const { name, code, description, manager_id, parent_department_id } = data;
        if (!name) return { status: 400, data: { error: true, message: "Department name is required" } };
        if (!code) return { status: 400, data: { error: true, message: "Department code is required" } };

        const existing = await Department.findOne({ where: { code } });
        if (existing) return { status: 400, data: { error: true, message: "Department code already exists" } };

        const department = await Department.create({
            name, code, description, manager_id: manager_id || null,
            parent_department_id: parent_department_id || null,
            active: true,
            created_at: new Date()
        });
        return { status: 201, data: { error: false, message: "Department created successfully", department } };
    } catch (error) {
        console.error('Error in createDepartmentService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const getAllDepartmentsService = async () => {
    try {
        const departments = await Department.findAll({
            where: { active: true },
            include: [
                { model: User, as: 'manager', attributes: ['user_id', 'full_name', 'company_email'] },
                { model: Department, as: 'parentDepartment', attributes: ['department_id', 'name', 'code'] },
                { model: Team, as: 'teams', attributes: ['team_id', 'name', 'code', 'active'], where: { active: true }, required: false }
            ],
            order: [['name', 'ASC']]
        });
        return { status: 200, data: { error: false, message: "Departments retrieved successfully", departments } };
    } catch (error) {
        console.error('Error in getAllDepartmentsService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const getDepartmentByIdService = async (id) => {
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
        return { status: 200, data: { error: false, message: "Department retrieved successfully", department } };
    } catch (error) {
        console.error('Error in getDepartmentByIdService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const updateDepartmentService = async (id, data) => {
    try {
        const department = await Department.findOne({ where: { department_id: id } });
        if (!department) return { status: 404, data: { error: true, message: "Department not found" } };

        const allowed = ['name', 'code', 'description', 'manager_id', 'parent_department_id', 'active'];
        const updateData = {};
        Object.keys(data).forEach(key => {
            if (allowed.includes(key)) updateData[key] = data[key];
        });
        updateData.updated_at = new Date();

        await department.update(updateData);
        return { status: 200, data: { error: false, message: "Department updated successfully" } };
    } catch (error) {
        console.error('Error in updateDepartmentService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const deleteDepartmentService = async (id) => {
    try {
        const department = await Department.findOne({ where: { department_id: id } });
        if (!department) return { status: 404, data: { error: true, message: "Department not found" } };
        await department.update({ active: false, updated_at: new Date() });
        return { status: 200, data: { error: false, message: "Department disabled successfully" } };
    } catch (error) {
        console.error('Error in deleteDepartmentService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};
