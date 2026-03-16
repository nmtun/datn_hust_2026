import '../models/associations.js';
import Team from '../models/Team.js';
import Department from '../models/Department.js';
import Employee from '../models/Employee.js';
import User from '../models/User.js';

export const createTeamService = async (data) => {
    try {
        const { name, code, department_id, leader_id, description } = data;
        if (!name) return { status: 400, data: { error: true, message: "Team name is required" } };
        if (!code) return { status: 400, data: { error: true, message: "Team code is required" } };
        if (!department_id) return { status: 400, data: { error: true, message: "Department ID is required" } };

        const existing = await Team.findOne({ where: { code } });
        if (existing) return { status: 400, data: { error: true, message: "Team code already exists" } };

        const team = await Team.create({
            name, code, department_id, leader_id: leader_id || null,
            description, active: true, created_at: new Date()
        });
        // Sync leader's team_id in Employee table
        if (leader_id) {
            await Employee.update({ team_id: team.team_id }, { where: { user_id: leader_id } });
        }
        return { status: 201, data: { error: false, message: "Team created successfully", team } };
    } catch (error) {
        console.error('Error in createTeamService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const getAllTeamsService = async (query = {}) => {
    try {
        const where = { active: true };
        if (query.department_id) where.department_id = query.department_id;

        const teams = await Team.findAll({
            where,
            include: [
                { model: Department, as: 'department', attributes: ['department_id', 'name', 'code'] },
                { model: User, as: 'leader', attributes: ['user_id', 'full_name', 'company_email'] }
            ],
            order: [['name', 'ASC']]
        });
        return { status: 200, data: { error: false, message: "Teams retrieved successfully", teams } };
    } catch (error) {
        console.error('Error in getAllTeamsService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const getTeamByIdService = async (id) => {
    try {
        const team = await Team.findOne({
            where: { team_id: id },
            include: [
                { model: Department, as: 'department', attributes: ['department_id', 'name', 'code'] },
                { model: User, as: 'leader', attributes: ['user_id', 'full_name', 'company_email'] },
                {
                    model: Employee,
                    as: 'members',
                    required: false,
                    include: [{ model: User, attributes: ['user_id', 'full_name', 'company_email', 'status'] }]
                }
            ]
        });
        if (!team) return { status: 404, data: { error: true, message: "Team not found" } };
        return { status: 200, data: { error: false, message: "Team retrieved successfully", team } };
    } catch (error) {
        console.error('Error in getTeamByIdService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const updateTeamService = async (id, data) => {
    try {
        const team = await Team.findOne({ where: { team_id: id } });
        if (!team) return { status: 404, data: { error: true, message: "Team not found" } };

        const allowed = ['name', 'code', 'department_id', 'leader_id', 'description', 'active'];
        const updateData = {};
        Object.keys(data).forEach(key => {
            if (allowed.includes(key)) updateData[key] = data[key];
        });
        updateData.updated_at = new Date();

        // Sync Employee.team_id when leader changes
        if ('leader_id' in data) {
            const oldLeaderId = team.leader_id;
            const newLeaderId = data.leader_id || null;
            if (oldLeaderId && oldLeaderId !== newLeaderId) {
                // Clear old leader's team_id if they were in this team
                await Employee.update({ team_id: null }, { where: { user_id: oldLeaderId, team_id: id } });
            }
            if (newLeaderId) {
                await Employee.update({ team_id: id }, { where: { user_id: newLeaderId } });
            }
        }

        await team.update(updateData);
        return { status: 200, data: { error: false, message: "Team updated successfully" } };
    } catch (error) {
        console.error('Error in updateTeamService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const addMemberToTeamService = async (teamId, userId) => {
    try {
        const team = await Team.findOne({ where: { team_id: teamId } });
        if (!team) return { status: 404, data: { error: true, message: "Team not found" } };

        const employee = await Employee.findOne({ where: { user_id: userId } });
        if (!employee) return { status: 404, data: { error: true, message: "Employee not found" } };

        await employee.update({ team_id: teamId });
        return { status: 200, data: { error: false, message: "Member added successfully" } };
    } catch (error) {
        console.error('Error in addMemberToTeamService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const removeMemberFromTeamService = async (teamId, userId) => {
    try {
        const employee = await Employee.findOne({ where: { user_id: userId, team_id: teamId } });
        if (!employee) return { status: 404, data: { error: true, message: "Member not found in team" } };

        await employee.update({ team_id: null });
        return { status: 200, data: { error: false, message: "Member removed successfully" } };
    } catch (error) {
        console.error('Error in removeMemberFromTeamService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const deleteTeamService = async (id) => {
    try {
        const team = await Team.findOne({ where: { team_id: id } });
        if (!team) return { status: 404, data: { error: true, message: "Team not found" } };
        // await team.update({ active: false, updated_at: new Date() });
        await team.destroy(); // Xóa hẳn khỏi database
        return { status: 200, data: { error: false, message: "Team deleted successfully" } };
    } catch (error) {
        console.error('Error in deleteTeamService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};
