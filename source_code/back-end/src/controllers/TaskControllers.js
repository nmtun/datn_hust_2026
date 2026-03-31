import * as taskService from '../services/TaskServices.js';

export const createTask = async (req, res) => {
    try {
        const result = await taskService.createTaskService(req.body, req.user);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error('Error creating task:', error);
        return res.status(500).json({ error: true, message: 'Internal server error' });
    }
};

export const getAllTasks = async (req, res) => {
    try {
        const result = await taskService.getAllTasksService(req.query, req.user);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error('Error getting tasks:', error);
        return res.status(500).json({ error: true, message: 'Internal server error' });
    }
};

export const getTaskById = async (req, res) => {
    try {
        const result = await taskService.getTaskByIdService(req.params.id, req.user);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error('Error getting task by id:', error);
        return res.status(500).json({ error: true, message: 'Internal server error' });
    }
};

export const updateTask = async (req, res) => {
    try {
        const result = await taskService.updateTaskService(req.params.id, req.body, req.user);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error('Error updating task:', error);
        return res.status(500).json({ error: true, message: 'Internal server error' });
    }
};

export const deleteTask = async (req, res) => {
    try {
        const result = await taskService.deleteTaskService(req.params.id, req.user);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error('Error deleting task:', error);
        return res.status(500).json({ error: true, message: 'Internal server error' });
    }
};

export const updateTaskStatus = async (req, res) => {
    try {
        const result = await taskService.updateTaskStatusService(req.params.id, req.body.status, req.user);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error('Error updating task status:', error);
        return res.status(500).json({ error: true, message: 'Internal server error' });
    }
};

export const addTaskComment = async (req, res) => {
    try {
        const result = await taskService.addTaskCommentService(req.params.id, req.body, req.user);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error('Error adding task comment:', error);
        return res.status(500).json({ error: true, message: 'Internal server error' });
    }
};

export const getTaskComments = async (req, res) => {
    try {
        const result = await taskService.getTaskCommentsService(req.params.id, req.user);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error('Error getting task comments:', error);
        return res.status(500).json({ error: true, message: 'Internal server error' });
    }
};

export const createTaskReview = async (req, res) => {
    try {
        const result = await taskService.createTaskReviewService(req.params.id, req.body, req.user);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error('Error creating task review:', error);
        return res.status(500).json({ error: true, message: 'Internal server error' });
    }
};
