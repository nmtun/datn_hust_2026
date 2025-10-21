import e from 'express';
import * as jobDescriptionService from '../services/JobDescriptionServices.js';

export const createJobDescription = async (req, res) => {
    try {
        const jobData = req.body;
        const user = req.user;
        const result = await jobDescriptionService.createJobDescription(jobData, user);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error creating job description:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getAllJobDescriptions = async (req, res) => {
    try {
        const result = await jobDescriptionService.getAllJobDescriptions();
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error fetching job descriptions:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getJobDescriptionById = async (req, res) => {
    try {
        const jobId = req.params.id;
        const result = await jobDescriptionService.getJobDescriptionById(jobId);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error fetching job description:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};
