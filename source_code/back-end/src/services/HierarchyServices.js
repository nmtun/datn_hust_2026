import { Op } from 'sequelize';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import Team from '../models/Team.js';

const uniq = (values = []) => [...new Set(values.filter(Boolean))];

const getNormalizedUserId = (input) => {
    if (input == null) return null;
    if (typeof input === 'number') return input;
    if (typeof input === 'string') {
        const parsed = Number(input);
        return Number.isNaN(parsed) ? null : parsed;
    }

    const raw = input.userId ?? input.user_id ?? null;
    if (raw == null) return null;

    const parsed = Number(raw);
    return Number.isNaN(parsed) ? null : parsed;
};

const getNormalizedRole = (input) => {
    if (typeof input === 'string') return input;
    return input?.role ?? null;
};

const getHierarchyRoleByStructure = async (userId, fallbackRole = 'employee') => {
    if (!userId) return fallbackRole;

    const [managedDepartments, ledTeams] = await Promise.all([
        getManagedDepartmentIds(userId),
        getEffectiveLedTeamIds(userId)
    ]);

    if (managedDepartments.length > 0) return 'department_head';
    if (ledTeams.length > 0) return 'team_lead';

    return fallbackRole;
};

export const getManagedDepartmentIds = async (userId) => {
    const departments = await Department.findAll({
        where: { manager_id: userId, active: true },
        attributes: ['department_id']
    });
    return departments.map((department) => department.department_id);
};

export const getLedTeamIds = async (userId, departmentIds = null) => {
    const where = { leader_id: userId, active: true };
    if (Array.isArray(departmentIds)) {
        if (departmentIds.length === 0) return [];
        where.department_id = { [Op.in]: departmentIds };
    }

    const teams = await Team.findAll({ where, attributes: ['team_id'] });
    return teams.map((team) => team.team_id);
};

const getManagedTeamIdsByDirectReports = async (teamLeadId, departmentIds = null) => {
    const where = {
        manager_id: teamLeadId,
        team_id: { [Op.ne]: null }
    };

    if (Array.isArray(departmentIds)) {
        if (departmentIds.length === 0) return [];
        where.department_id = { [Op.in]: departmentIds };
    }

    const reports = await Employee.findAll({ where, attributes: ['team_id'] });
    return uniq(reports.map((report) => report.team_id));
};

export const getEffectiveLedTeamIds = async (userId, departmentIds = null) => {
    const [ledTeamIds, managedTeamIds] = await Promise.all([
        getLedTeamIds(userId, departmentIds),
        getManagedTeamIdsByDirectReports(userId, departmentIds)
    ]);

    return uniq([...ledTeamIds, ...managedTeamIds]);
};

const getDirectReportIds = async (managerId) => {
    const reports = await Employee.findAll({
        where: { manager_id: managerId },
        attributes: ['user_id']
    });
    return uniq(reports.map((report) => report.user_id));
};

const getManagerReportIds = async (managerId) => {
    const directReportIds = await getDirectReportIds(managerId);
    if (directReportIds.length === 0) return [];

    // Department heads are now stored with role = employee,
    // so use real direct-report relationships instead of role filtering.
    return directReportIds;
};

export const getDepartmentHeadIdsForManager = async (managerId) => {
    const managerReportIds = await getManagerReportIds(managerId);
    if (managerReportIds.length === 0) return [];

    const managedDepartments = await Department.findAll({
        where: {
            manager_id: { [Op.in]: managerReportIds },
            active: true
        },
        attributes: ['manager_id']
    });

    return uniq(managedDepartments.map((item) => item.manager_id));
};

export const getTeamLeadIdsForDepartmentHead = async (departmentHeadId) => {
    const managedDepartmentIds = await getManagedDepartmentIds(departmentHeadId);
    if (managedDepartmentIds.length === 0) return [];

    const teams = await Team.findAll({
        where: {
            department_id: { [Op.in]: managedDepartmentIds },
            active: true,
            leader_id: { [Op.ne]: null }
        },
        attributes: ['leader_id']
    });

    return uniq(teams.map((team) => team.leader_id));
};

export const getMemberIdsForTeamLead = async (teamLeadId) => {
    const ledTeamIds = await getEffectiveLedTeamIds(teamLeadId);

    const orClauses = [{ manager_id: teamLeadId }];
    if (ledTeamIds.length > 0) {
        orClauses.push({ team_id: { [Op.in]: ledTeamIds } });
    }

    const members = await Employee.findAll({
        where: {
            [Op.or]: orClauses,
            user_id: { [Op.ne]: teamLeadId }
        },
        attributes: ['user_id']
    });

    return uniq(members.map((member) => member.user_id));
};

const getAllDepartmentHeadIds = async () => {
    const departments = await Department.findAll({
        where: { active: true, manager_id: { [Op.ne]: null } },
        attributes: ['manager_id']
    });
    return uniq(departments.map((department) => department.manager_id));
};

const getAllTeamLeadIds = async () => {
    const teams = await Team.findAll({
        where: { active: true, leader_id: { [Op.ne]: null } },
        attributes: ['leader_id']
    });
    return uniq(teams.map((team) => team.leader_id));
};

export const resolveHierarchyRole = async (context) => {
    const userId = getNormalizedUserId(context);
    const role = getNormalizedRole(context);

    if (!role) return 'employee';
    if (role === 'candidate') return role;
    if (role === 'manager') return 'manager';
    if (!['employee', 'hr'].includes(role)) return role;

    const fallbackRole = role === 'hr' ? 'hr' : 'employee';
    return getHierarchyRoleByStructure(userId, fallbackRole);
};

export const getEvaluationTargetUserIds = async (context) => {
    const userId = getNormalizedUserId(context);
    const role = getNormalizedRole(context);

    if (!userId || !role) return [];

    if (role === 'manager') {
        return getDepartmentHeadIdsForManager(userId);
    }

    if (!['employee', 'hr'].includes(role)) return [];

    const hierarchyRole = await resolveHierarchyRole({ userId, role });

    if (hierarchyRole === 'hr') {
        const users = await User.findAll({
            where: {
                role: { [Op.in]: ['employee', 'manager', 'hr'] },
                is_deleted: false,
                user_id: { [Op.ne]: userId }
            },
            attributes: ['user_id']
        });
        return users.map((user) => user.user_id);
    }

    if (hierarchyRole === 'department_head') {
        return getTeamLeadIdsForDepartmentHead(userId);
    }

    if (hierarchyRole === 'team_lead') {
        const [memberIds, allDepartmentHeads, allTeamLeads] = await Promise.all([
            getMemberIdsForTeamLead(userId),
            getAllDepartmentHeadIds(),
            getAllTeamLeadIds()
        ]);

        const blocked = new Set([...allDepartmentHeads, ...allTeamLeads, userId]);
        return memberIds.filter((memberId) => !blocked.has(memberId));
    }

    return [];
};

export const getManagementTargetUserIds = async (context) => {
    const userId = getNormalizedUserId(context);
    const role = getNormalizedRole(context);

    if (!userId || !role) return [];

    if (role === 'manager') {
        return getDepartmentHeadIdsForManager(userId);
    }

    if (!['employee', 'hr'].includes(role)) return [];

    const hierarchyRole = await resolveHierarchyRole({ userId, role });

    if (hierarchyRole === 'hr') {
        const users = await User.findAll({
            where: {
                role: { [Op.in]: ['employee', 'manager', 'hr'] },
                is_deleted: false,
                user_id: { [Op.ne]: userId }
            },
            attributes: ['user_id']
        });
        return users.map((user) => user.user_id);
    }

    if (hierarchyRole === 'department_head') {
        const managedDepartmentIds = await getManagedDepartmentIds(userId);
        if (managedDepartmentIds.length === 0) return [];

        const employees = await Employee.findAll({
            where: {
                department_id: { [Op.in]: managedDepartmentIds },
                user_id: { [Op.ne]: userId }
            },
            attributes: ['user_id']
        });

        return uniq(employees.map((employee) => employee.user_id));
    }

    if (hierarchyRole === 'team_lead') {
        const [memberIds, allDepartmentHeads, allTeamLeads] = await Promise.all([
            getMemberIdsForTeamLead(userId),
            getAllDepartmentHeadIds(),
            getAllTeamLeadIds()
        ]);

        const blocked = new Set([...allDepartmentHeads, ...allTeamLeads, userId]);
        return memberIds.filter((memberId) => !blocked.has(memberId));
    }

    return [];
};

export const getManageableTeamIds = async (context) => {
    const userId = getNormalizedUserId(context);
    const role = getNormalizedRole(context);

    if (!userId || !role) return [];

    if (role === 'manager') {
        const teams = await Team.findAll({ where: { active: true }, attributes: ['team_id'] });
        return teams.map((team) => team.team_id);
    }

    if (!['employee', 'hr'].includes(role)) return [];

    const hierarchyRole = await resolveHierarchyRole({ userId, role });

    if (hierarchyRole === 'hr') {
        const teams = await Team.findAll({ where: { active: true }, attributes: ['team_id'] });
        return teams.map((team) => team.team_id);
    }

    if (hierarchyRole === 'department_head') {
        const managedDepartmentIds = await getManagedDepartmentIds(userId);
        if (managedDepartmentIds.length === 0) return [];

        const teams = await Team.findAll({
            where: {
                active: true,
                department_id: { [Op.in]: managedDepartmentIds }
            },
            attributes: ['team_id']
        });

        return teams.map((team) => team.team_id);
    }

    if (hierarchyRole === 'team_lead') {
        return getEffectiveLedTeamIds(userId);
    }

    return [];
};

export const canManageTeam = async (context) => {
    const userId = getNormalizedUserId(context);
    const role = getNormalizedRole(context);
    const team = context?.team;

    if (!team) return false;
    if (!role) return false;
    if (role === 'manager') return true;
    if (!['employee', 'hr'].includes(role)) return false;
    if (!userId) return false;

    const hierarchyRole = await resolveHierarchyRole({ userId, role });

    if (hierarchyRole === 'hr') return true;

    if (hierarchyRole === 'department_head') {
        const managedDepartmentIds = await getManagedDepartmentIds(userId);
        return managedDepartmentIds.includes(team.department_id);
    }

    if (hierarchyRole === 'team_lead') {
        if (team.leader_id === userId) return true;

        const manageableTeamIds = await getEffectiveLedTeamIds(userId);
        return manageableTeamIds.includes(team.team_id);
    }

    return false;
};
