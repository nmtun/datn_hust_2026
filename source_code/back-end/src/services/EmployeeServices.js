import '../models/associations.js';
import Employee from '../models/Employee.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import Team from '../models/Team.js';
import { Op } from 'sequelize';
import { getLedTeamIds, getManagedDepartmentIds, getManagementTargetUserIds, resolveHierarchyRole } from './HierarchyServices.js';

// Create employee service
export const createEmployeeService = async (employeeData) => {
    return await Employee.create(employeeData);
};

// Get my profile (Employee / Manager self-service)
export const getMyProfileService = async (userId) => {
    try {
        const user = await User.findOne({
            where: { user_id: userId, is_deleted: false },
            attributes: { exclude: ['password'] },
            include: [
                {
                    model: Employee,
                    as: 'Employee_Info',
                    required: false,
                    include: [
                        { model: Department, as: 'department', attributes: ['department_id', 'name', 'code'] },
                        { model: Team, as: 'team', attributes: ['team_id', 'name', 'code'] },
                        { model: User, as: 'manager', attributes: ['user_id', 'full_name', 'company_email'] }
                    ]
                }
            ]
        });
        if (!user) return { status: 404, data: { error: true, message: "Employee not found" } };
        return { status: 200, data: { error: false, message: "Profile retrieved successfully", profile: user } };
    } catch (error) {
        console.error('Error in getMyProfileService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

// Update my profile (Employee: phone_number, address only)
export const updateMyProfileService = async (userId, { phone_number, address }) => {
    try {
        const user = await User.findOne({ where: { user_id: userId, is_deleted: false } });
        if (!user) return { status: 404, data: { error: true, message: "Employee not found" } };

        const updateData = {};
        if (phone_number !== undefined) updateData.phone_number = phone_number;
        if (address !== undefined) updateData.address = address;

        await user.update(updateData);
        return { status: 200, data: { error: false, message: "Profile updated successfully" } };
    } catch (error) {
        console.error('Error in updateMyProfileService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

// Get all employees (HR)
export const getAllEmployeesService = async (query = {}, requestingUser = null) => {
    try {
        const { full_name, department_id, status } = query;

        const userWhere = { is_deleted: false, role: { [Op.in]: ['employee', 'manager', 'hr'] } };
        if (full_name) userWhere.full_name = { [Op.like]: `%${full_name}%` };
        if (status) userWhere.status = status;

        const employeeWhere = {};
        let employeeRequired = false;

        if (department_id) {
            employeeWhere.department_id = Number(department_id);
            employeeRequired = true;
        }

        if (requestingUser && requestingUser.role === 'manager') {
            const hierarchyRole = await resolveHierarchyRole({
                userId: requestingUser.user_id,
                role: requestingUser.role
            });

            if (hierarchyRole === 'department_head') {
                const managedDepartmentIds = await getManagedDepartmentIds(requestingUser.user_id);
                if (managedDepartmentIds.length === 0) {
                    return { status: 200, data: { error: false, message: 'Employees retrieved successfully', employees: [] } };
                }

                if (employeeWhere.department_id && !managedDepartmentIds.includes(employeeWhere.department_id)) {
                    return { status: 200, data: { error: false, message: 'Employees retrieved successfully', employees: [] } };
                }

                employeeWhere.department_id = employeeWhere.department_id
                    ? employeeWhere.department_id
                    : { [Op.in]: managedDepartmentIds };
                employeeRequired = true;
                userWhere.user_id = { [Op.ne]: requestingUser.user_id };
            } else if (hierarchyRole === 'team_lead') {
                const ledTeamIds = await getLedTeamIds(requestingUser.user_id);
                if (ledTeamIds.length === 0) {
                    return { status: 200, data: { error: false, message: 'Employees retrieved successfully', employees: [] } };
                }

                const ledTeams = await Team.findAll({
                    where: { team_id: { [Op.in]: ledTeamIds } },
                    attributes: ['department_id']
                });

                const departmentIds = [...new Set(ledTeams.map((team) => team.department_id).filter(Boolean))];
                if (departmentIds.length === 0) {
                    return { status: 200, data: { error: false, message: 'Employees retrieved successfully', employees: [] } };
                }

                if (employeeWhere.department_id && !departmentIds.includes(employeeWhere.department_id)) {
                    return { status: 200, data: { error: false, message: 'Employees retrieved successfully', employees: [] } };
                }

                employeeWhere.department_id = employeeWhere.department_id
                    ? employeeWhere.department_id
                    : { [Op.in]: departmentIds };
                employeeRequired = true;
                userWhere.user_id = { [Op.ne]: requestingUser.user_id };
            }
        }

        const employees = await User.findAll({
            where: userWhere,
            attributes: { exclude: ['password'] },
            include: [
                {
                    model: Employee,
                    as: 'Employee_Info',
                    required: employeeRequired,
                    where: Object.keys(employeeWhere).length > 0 ? employeeWhere : undefined,
                    include: [
                        { model: Department, as: 'department', attributes: ['department_id', 'name', 'code'] },
                        { model: Team, as: 'team', attributes: ['team_id', 'name', 'code'] },
                        { model: User, as: 'manager', attributes: ['user_id', 'full_name', 'company_email'] }
                    ]
                }
            ],
            order: [['full_name', 'ASC']]
        });
        return { status: 200, data: { error: false, message: "Employees retrieved successfully", employees } };
    } catch (error) {
        console.error('Error in getAllEmployeesService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

// Get employee by ID (HR + Manager)
export const getEmployeeByIdService = async (userId, requestingUser = null) => {
    try {
        if (requestingUser && requestingUser.role === 'manager') {
            const hierarchyRole = await resolveHierarchyRole({
                userId: requestingUser.user_id,
                role: requestingUser.role
            });

            if (hierarchyRole !== 'manager' && Number(userId) !== Number(requestingUser.user_id)) {
                const manageableIds = await getManagementTargetUserIds(requestingUser);
                if (!manageableIds.includes(Number(userId))) {
                    return { status: 403, data: { error: true, message: 'Access denied' } };
                }
            }
        }

        const user = await User.findOne({
            where: { user_id: userId, is_deleted: false },
            attributes: { exclude: ['password'] },
            include: [
                {
                    model: Employee,
                    as: 'Employee_Info',
                    required: false,
                    include: [
                        { model: Department, as: 'department', attributes: ['department_id', 'name', 'code'] },
                        { model: Team, as: 'team', attributes: ['team_id', 'name', 'code'] },
                        { model: User, as: 'manager', attributes: ['user_id', 'full_name', 'company_email'] }
                    ]
                }
            ]
        });
        if (!user) return { status: 404, data: { error: true, message: "Employee not found" } };
        return { status: 200, data: { error: false, message: "Employee retrieved successfully", employee: user } };
    } catch (error) {
        console.error('Error in getEmployeeByIdService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

// Update employee info (HR)
export const updateEmployeeService = async (userId, updateData) => {
    try {
        const user = await User.findOne({ where: { user_id: userId, is_deleted: false } });
        if (!user) return { status: 404, data: { error: true, message: "Employee not found" } };

        const employee = await Employee.findOne({ where: { user_id: userId } });

        const userFields = ['full_name', 'phone_number', 'address', 'role'];
        const employeeFields = ['position', 'department_id', 'team_id', 'manager_id', 'hire_date', 'termination_date', 'employee_id_number'];

        const userUpdate = {};
        const employeeUpdate = {};
        Object.keys(updateData).forEach(key => {
            if (userFields.includes(key)) userUpdate[key] = updateData[key];
            else if (employeeFields.includes(key)) employeeUpdate[key] = updateData[key];
        });

        if (Object.keys(userUpdate).length > 0) await user.update(userUpdate);
        if (employee && Object.keys(employeeUpdate).length > 0) await employee.update(employeeUpdate);

        return { status: 200, data: { error: false, message: "Employee updated successfully" } };
    } catch (error) {
        console.error('Error in updateEmployeeService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

// Update employee status (HR)
export const updateEmployeeStatusService = async (userId, status) => {
    try {
        const allowed = ['active', 'on_leave', 'terminated'];
        if (!allowed.includes(status)) {
            return { status: 400, data: { error: true, message: "Invalid status. Must be: active, on_leave, terminated" } };
        }
        const user = await User.findOne({ where: { user_id: userId, is_deleted: false } });
        if (!user) return { status: 404, data: { error: true, message: "Employee not found" } };

        await user.update({ status });
        return { status: 200, data: { error: false, message: `Employee status updated to ${status}` } };
    } catch (error) {
        console.error('Error in updateEmployeeStatusService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

// Get my team members (Manager)
export const getMyTeamService = async (requestingUser) => {
    try {
        const managerId = requestingUser.user_id;

        const hierarchyRole = await resolveHierarchyRole({
            userId: managerId,
            role: requestingUser.role
        });

        let where = { manager_id: managerId };

        if (hierarchyRole === 'department_head') {
            const managedDepartmentIds = await getManagedDepartmentIds(managerId);
            if (managedDepartmentIds.length === 0) {
                return { status: 200, data: { error: false, message: 'Team members retrieved successfully', employees: [] } };
            }
            where = {
                department_id: { [Op.in]: managedDepartmentIds },
                user_id: { [Op.ne]: managerId }
            };
        } else if (hierarchyRole === 'team_lead') {
            const ledTeamIds = await getLedTeamIds(managerId);
            if (ledTeamIds.length === 0) {
                return { status: 200, data: { error: false, message: 'Team members retrieved successfully', employees: [] } };
            }
            where = {
                team_id: { [Op.in]: ledTeamIds },
                user_id: { [Op.ne]: managerId }
            };
        }

        const employees = await Employee.findAll({
            where,
            include: [
                {
                    model: User,
                    attributes: { exclude: ['password'] }
                },
                { model: Department, as: 'department', attributes: ['department_id', 'name', 'code'] },
                { model: Team, as: 'team', attributes: ['team_id', 'name', 'code'] }
            ]
        });
        return { status: 200, data: { error: false, message: "Team members retrieved successfully", employees } };
    } catch (error) {
        console.error('Error in getMyTeamService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const getManagedEmployeesService = async (requestingUser) => {
    try {
        const managedIds = await getManagementTargetUserIds(requestingUser);
        if (managedIds.length === 0) {
            return { status: 200, data: { error: false, message: 'Managed employees retrieved successfully', employees: [] } };
        }

        const employees = await User.findAll({
            where: {
                user_id: { [Op.in]: managedIds },
                is_deleted: false
            },
            attributes: { exclude: ['password'] },
            include: [
                {
                    model: Employee,
                    as: 'Employee_Info',
                    required: false,
                    include: [
                        { model: Department, as: 'department', attributes: ['department_id', 'name', 'code'] },
                        { model: Team, as: 'team', attributes: ['team_id', 'name', 'code'] },
                        { model: User, as: 'manager', attributes: ['user_id', 'full_name', 'company_email'] }
                    ]
                }
            ],
            order: [['full_name', 'ASC']]
        });

        return {
            status: 200,
            data: {
                error: false,
                message: 'Managed employees retrieved successfully',
                employees
            }
        };
    } catch (error) {
        console.error('Error in getManagedEmployeesService:', error);
        return { status: 500, data: { error: true, message: 'Internal server error', details: error.message } };
    }
};
