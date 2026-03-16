import * as teamService from '../services/TeamServices.js';

export const createTeam = async (req, res) => {
    try {
        const result = await teamService.createTeamService(req.body);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error creating team:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getAllTeams = async (req, res) => {
    try {
        const result = await teamService.getAllTeamsService(req.query);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error getting teams:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getTeamById = async (req, res) => {
    try {
        const result = await teamService.getTeamByIdService(req.params.id);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error getting team:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const updateTeam = async (req, res) => {
    try {
        const result = await teamService.updateTeamService(req.params.id, req.body);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error updating team:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const addMember = async (req, res) => {
    try {
        const result = await teamService.addMemberToTeamService(req.params.id, req.body.user_id);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error adding member:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const removeMember = async (req, res) => {
    try {
        const result = await teamService.removeMemberFromTeamService(req.params.id, req.body.user_id);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error removing member:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const deleteTeam = async (req, res) => {
    try {
        const result = await teamService.deleteTeamService(req.params.id);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error deleting team:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};
