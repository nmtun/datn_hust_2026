import * as projectService from '../services/ProjectServices.js';

export const createProject = async (req, res) => {
    try {
        const result = await projectService.createProjectService(req.body, req.user);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error('Error creating project:', error);
        return res.status(500).json({ error: true, message: 'Internal server error' });
    }
};

export const getAllProjects = async (req, res) => {
    try {
        const result = await projectService.getAllProjectsService(req.query, req.user);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error('Error getting projects:', error);
        return res.status(500).json({ error: true, message: 'Internal server error' });
    }
};

export const getProjectById = async (req, res) => {
    try {
        const result = await projectService.getProjectByIdService(req.params.id, req.user);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error('Error getting project by id:', error);
        return res.status(500).json({ error: true, message: 'Internal server error' });
    }
};

export const updateProject = async (req, res) => {
    try {
        const result = await projectService.updateProjectService(req.params.id, req.body, req.user);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error('Error updating project:', error);
        return res.status(500).json({ error: true, message: 'Internal server error' });
    }
};

export const deleteProject = async (req, res) => {
    try {
        const result = await projectService.deleteProjectService(req.params.id, req.user);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error('Error deleting project:', error);
        return res.status(500).json({ error: true, message: 'Internal server error' });
    }
};
