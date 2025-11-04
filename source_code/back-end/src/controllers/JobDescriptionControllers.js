import e from 'express';
import * as jobDescriptionService from '../services/JobDescriptionServices.js';

export const createJobDescription = async (req, res) => {
    try {
        const jobData = req.body;
        const user = req.user;
        const result = await jobDescriptionService.createJobDescriptionService(jobData, user);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error creating job description:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getAllJobDescriptions = async (req, res) => {
    try {
        const result = await jobDescriptionService.getAllJobDescriptionsService();
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error fetching job descriptions:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getJobDescriptionById = async (req, res) => {
    try {
        const jobId = req.params.id;
        const result = await jobDescriptionService.getJobDescriptionByIdService(jobId);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error fetching job description:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const updateJobDescription = async (req, res) => {
    try {
        const jobId = req.params.id;
        const jobData = req.body;
        const result = await jobDescriptionService.updateJobDescriptionService(jobId, jobData);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error updating job description:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const deleteJobDescription = async (req, res) => {
    try {
        const jobId = req.params.id;
        const result = await jobDescriptionService.deleteJobDescriptionService(jobId);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error deleting job description:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getDeletedJobDescriptions = async (req, res) => {
    try {
        const result = await jobDescriptionService.getDeletedJobDescriptionsService();
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error fetching deleted job descriptions:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const restoreJobDescription = async (req, res) => {
    try {
        const jobId = req.params.id;
        const result = await jobDescriptionService.restoreJobDescriptionService(jobId);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error restoring job description:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const searchJobDescriptions = async (req, res) => {
    try {
        const query = req.query;
        const result = await jobDescriptionService.searchJobDescriptionsService(query);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error searching job descriptions:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};