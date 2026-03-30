import '../models/associations.js';
import { Op } from 'sequelize';
import Team from '../models/Team.js';
import Department from '../models/Department.js';
import Employee from '../models/Employee.js';
import User from '../models/User.js';
import { canManageTeam, getManagedDepartmentIds, getManageableTeamIds, resolveHierarchyRole } from './HierarchyServices.js';

const baseTeamIncludes = [
    { model: Department, as: 'department', attributes: ['department_id', 'name', 'code'] },
    { model: User, as: 'leader', attributes: ['user_id', 'full_name', 'company_email'] }
];

const canEditTeam = async (requestingUser, team) => {
    if (!requestingUser || !team) return false;

    if (requestingUser.role === 'hr') return true;
    if (requestingUser.role === 'manager') return true;
    if (requestingUser.role !== 'employee') return false;
    // Department head can view managed teams but cannot edit team entities.
    return false;
};

const buildTeamWhere = async (query = {}, requestingUser = null) => {
    const where = { active: true };

    if (query.department_id) {
        where.department_id = Number(query.department_id);
    }

    if (!requestingUser) return where;

    if (requestingUser.role === 'hr') {
        return where;
    }

    if (requestingUser.role === 'manager') {
        return where;
    }

    if (requestingUser.role !== 'employee') {
        return { active: true, team_id: -1 };
    }

    const hierarchyRole = await resolveHierarchyRole({
        userId: requestingUser.user_id,
        role: requestingUser.role
    });

    if (hierarchyRole === 'department_head') {
        const managedDepartmentIds = await getManagedDepartmentIds(requestingUser.user_id);
        if (managedDepartmentIds.length === 0) return { active: true, team_id: -1 };

        if (where.department_id && !managedDepartmentIds.includes(where.department_id)) {
            return { active: true, team_id: -1 };
        }

        where.department_id = where.department_id
            ? where.department_id
            : { [Op.in]: managedDepartmentIds };
        return where;
    }

    if (hierarchyRole === 'team_lead') {
        return {
            ...where,
            leader_id: requestingUser.user_id
        };
    }

    return where;
};

export const createTeamService = async (data, requestingUser) => {
    try {
        const { name, code, department_id, leader_id, description } = data;
        if (!name) return { status: 400, data: { error: true, message: "Team name is required" } };
        if (!code) return { status: 400, data: { error: true, message: "Team code is required" } };
        if (!department_id) return { status: 400, data: { error: true, message: "Department ID is required" } };

        const department = await Department.findOne({
            where: { department_id, active: true },
            attributes: ['department_id', 'manager_id']
        });
        if (!department) return { status: 404, data: { error: true, message: 'Department not found' } };

        if (!requestingUser || !['hr', 'manager'].includes(requestingUser.role)) {
            return { status: 403, data: { error: true, message: 'Access denied' } };
        }

        const existing = await Team.findOne({ where: { code } });
        if (existing) return { status: 400, data: { error: true, message: "Team code already exists" } };

        const team = await Team.create({
            name, code, department_id, leader_id: leader_id || null,
            description, active: true, created_at: new Date()
        });
        // Sync leader's team_id in Employee table
        if (leader_id) {
            await Employee.update(
                {
                    team_id: team.team_id,
                    department_id,
                    manager_id: department.manager_id || null
                },
                { where: { user_id: leader_id } }
            );
        }
        return { status: 201, data: { error: false, message: "Team created successfully", team } };
    } catch (error) {
        console.error('Error in createTeamService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const getAllTeamsService = async (query = {}, requestingUser = null) => {
    try {
        const where = await buildTeamWhere(query, requestingUser);

        const teams = await Team.findAll({
            where,
            include: baseTeamIncludes,
            order: [['name', 'ASC']]
        });
        return { status: 200, data: { error: false, message: "Teams retrieved successfully", teams } };
    } catch (error) {
        console.error('Error in getAllTeamsService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const getTeamByIdService = async (id, requestingUser = null) => {
    try {
        const team = await Team.findOne({
            where: { team_id: id },
            include: [
                ...baseTeamIncludes,
                {
                    model: Employee,
                    as: 'members',
                    required: false,
                    include: [{ model: User, attributes: ['user_id', 'full_name', 'company_email', 'status'] }]
                }
            ]
        });
        if (!team) return { status: 404, data: { error: true, message: "Team not found" } };

        if (requestingUser && ['manager', 'employee'].includes(requestingUser.role)) {
            const canManage = await canManageTeam({
                userId: requestingUser.user_id,
                role: requestingUser.role,
                team
            });
            if (!canManage) {
                return { status: 403, data: { error: true, message: 'Access denied' } };
            }
        }

        return { status: 200, data: { error: false, message: "Team retrieved successfully", team } };
    } catch (error) {
        console.error('Error in getTeamByIdService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const updateTeamService = async (id, data, requestingUser) => {
    try {
        const team = await Team.findOne({ where: { team_id: id } });
        if (!team) return { status: 404, data: { error: true, message: "Team not found" } };

        const canEdit = await canEditTeam(requestingUser, team);
        if (!canEdit) {
            return { status: 403, data: { error: true, message: 'Access denied' } };
        }

        const allowed = ['name', 'code', 'department_id', 'leader_id', 'description', 'active'];
        const updateData = {};
        Object.keys(data).forEach(key => {
            if (allowed.includes(key)) updateData[key] = data[key];
        });
        updateData.updated_at = new Date();

        const targetDepartmentId = updateData.department_id || team.department_id;
        const department = await Department.findOne({
            where: { department_id: targetDepartmentId, active: true },
            attributes: ['department_id', 'manager_id']
        });

        if (!department) {
            return { status: 404, data: { error: true, message: 'Department not found' } };
        }

        // Sync Employee.team_id when leader changes
        if ('leader_id' in data) {
            const oldLeaderId = team.leader_id;
            const newLeaderId = data.leader_id || null;
            if (oldLeaderId && oldLeaderId !== newLeaderId) {
                // Clear old leader's team_id if they were in this team
                await Employee.update(
                    { team_id: null, manager_id: null },
                    { where: { user_id: oldLeaderId, team_id: id } }
                );
            }
            if (newLeaderId) {
                await Employee.update(
                    {
                        team_id: id,
                        department_id: targetDepartmentId,
                        manager_id: department.manager_id || null
                    },
                    { where: { user_id: newLeaderId } }
                );

                await Employee.update(
                    { manager_id: newLeaderId },
                    {
                        where: {
                            team_id: id,
                            user_id: { [Op.ne]: newLeaderId }
                        }
                    }
                );
            }
        }

        await team.update(updateData);
        return { status: 200, data: { error: false, message: "Team updated successfully" } };
    } catch (error) {
        console.error('Error in updateTeamService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const addMemberToTeamService = async (teamId, userId, requestingUser) => {
    try {
        const team = await Team.findOne({ where: { team_id: teamId } });
        if (!team) return { status: 404, data: { error: true, message: "Team not found" } };

        const canManage = await canManageTeam({
            userId: requestingUser.user_id,
            role: requestingUser.role,
            team
        });
        if (!canManage) {
            return { status: 403, data: { error: true, message: 'Access denied' } };
        }

        const employee = await Employee.findOne({ where: { user_id: userId } });
        if (!employee) return { status: 404, data: { error: true, message: "Employee not found" } };

        const nextData = {
            team_id: teamId,
            department_id: team.department_id,
            manager_id: team.leader_id || employee.manager_id || null
        };

        await employee.update(nextData);
        return { status: 200, data: { error: false, message: "Member added successfully" } };
    } catch (error) {
        console.error('Error in addMemberToTeamService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const removeMemberFromTeamService = async (teamId, userId, requestingUser) => {
    try {
        const team = await Team.findOne({ where: { team_id: teamId } });
        if (!team) return { status: 404, data: { error: true, message: 'Team not found' } };

        const canManage = await canManageTeam({
            userId: requestingUser.user_id,
            role: requestingUser.role,
            team
        });
        if (!canManage) {
            return { status: 403, data: { error: true, message: 'Access denied' } };
        }

        const employee = await Employee.findOne({ where: { user_id: userId, team_id: teamId } });
        if (!employee) return { status: 404, data: { error: true, message: "Member not found in team" } };

        const updateData = { team_id: null };
        if (team.leader_id && employee.manager_id === team.leader_id) {
            updateData.manager_id = null;
        }

        await employee.update(updateData);
        return { status: 200, data: { error: false, message: "Member removed successfully" } };
    } catch (error) {
        console.error('Error in removeMemberFromTeamService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const deleteTeamService = async (id, requestingUser) => {
    try {
        const team = await Team.findOne({ where: { team_id: id } });
        if (!team) return { status: 404, data: { error: true, message: "Team not found" } };

        const canEdit = await canEditTeam(requestingUser, team);
        if (!canEdit) {
            return { status: 403, data: { error: true, message: 'Access denied' } };
        }

        // await team.update({ active: false, updated_at: new Date() });
        await team.destroy(); // Xóa hẳn khỏi database
        return { status: 200, data: { error: false, message: "Team deleted successfully" } };
    } catch (error) {
        console.error('Error in deleteTeamService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const getManagedTeamsService = async (requestingUser) => {
    try {
        const manageableTeamIds = await getManageableTeamIds(requestingUser);
        if (manageableTeamIds.length === 0) {
            return { status: 200, data: { error: false, message: 'No managed teams found', teams: [] } };
        }

        const teams = await Team.findAll({
            where: {
                team_id: { [Op.in]: manageableTeamIds },
                active: true
            },
            include: baseTeamIncludes,
            order: [['name', 'ASC']]
        });

        return { status: 200, data: { error: false, message: 'Managed teams retrieved successfully', teams } };
    } catch (error) {
        console.error('Error in getManagedTeamsService:', error);
        return { status: 500, data: { error: true, message: 'Internal server error', details: error.message } };
    }
};
