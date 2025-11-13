import JobDescription from "../models/JobDescription.js";
import { Op } from "sequelize";

export const createJobDescriptionService = async (jobData, user) => {
    const {
        title,
        description,
        location,
        type_of_work,
        requirements,
        responsibilities,
        qualifications,
        experience_level,
        employment_type,
        salary_range_min,
        salary_range_max,
        status = 'draft',
        posting_date,
        closing_date,
        positions_count,
        department_id
    } = jobData;

    const processedRequirements = Array.isArray(requirements) ? requirements.join('\n') : requirements;
    const processedResponsibilities = Array.isArray(responsibilities) ? responsibilities.join('\n') : responsibilities;
    const processedQualifications = Array.isArray(qualifications) ? qualifications.join('\n') : qualifications;

    // Validate 
    if (!title || !description || !requirements || !responsibilities || !qualifications || !experience_level || !employment_type || salary_range_min == null || salary_range_max == null) {
        return { status: 400, data: { error: true, message: "Thiếu thông tin" } };
    }

    const created_by = user.user_id;

    const newJob = await JobDescription.create({
        title,
        description,
        location,
        type_of_work,
        requirements: processedRequirements,
        responsibilities: processedResponsibilities,
        qualifications: processedQualifications,
        experience_level,
        employment_type,
        salary_range_min,
        salary_range_max,
        status,
        posting_date,
        closing_date,
        positions_count,
        department_id,
        created_by
    });

    return { 
        status: 201, 
        data: { 
            error: false,
            message: "Job description created successfully",
            newJob 
        } 
    };
};

export const getAllJobDescriptionsService = async (includeDeleted = false) => {
    const jobs = await JobDescription.findAll({
        where: includeDeleted ? {} : { is_deleted: false }
    });
    return {
        status: 200,
        data: {
            error: false,
            jobs
        }
    };
};

export const getDeletedJobDescriptionsService = async () => {
    const jobs = await JobDescription.findAll({
        where: { is_deleted: true }
    });
    return {
        status: 200,
        data: {
            error: false,
            jobs
        }
    };
};

export const restoreJobDescriptionService = async (jobId) => {
    const job = await JobDescription.findByPk(jobId);
    if (!job) {
        return { status: 404, data: { error: true, message: "Job description not found" } };
    }
    if (!job.is_deleted) {
        return { status: 400, data: { error: true, message: "Job description is not deleted" } };
    }

    await job.update({ is_deleted: false });
    return {
        status: 200,
        data: {
            error: false,
            message: "Job description restored successfully",
            job
        }
    };
};

export const getJobDescriptionByIdService = async (jobId) => {
    const job = await JobDescription.findByPk(jobId);
    return {
        status: 200,
        data: {
            error: false,
            job
        }
    };
};

export const updateJobDescriptionService = async (jobId, jobData) => {
    const job = await JobDescription.findByPk(jobId);
    if (!job) {
        return { status: 404, data: { error: true, message: "Job description not found" } };
    }
    
    const updated_at = new Date();
    jobData.updated_at = updated_at;

    // Update job description
    await job.update(jobData);
    return {
        status: 200,
        data: {
            error: false,
            message: "Job description updated successfully",
            job
        }
    };
};

export const deleteJobDescriptionService = async (jobId) => {
    const job = await JobDescription.findByPk(jobId);
    if (!job) {
        return { status: 404, data: { error: true, message: "Job description not found" } };
    }

    await job.update({ is_deleted: true });
    return {
        status: 200,
        data: {
            error: false,
            message: "Job description deleted successfully"
        }
    };
};


export const searchJobDescriptionsService = async (query = {}) => {
    const {
        title,
        location,
        experience_level
    } = query;

    const where = {};

    if (title) {
        where.title = { [Op.like]: `%${title}%` };
    }
    if (location) {
        where.location = { [Op.like]: `%${location}%` };
    }
    if (experience_level) {
        where.experience_level = { [Op.like]: `%${experience_level}%` };
    }

    where.is_deleted = false;

    const jobs = await JobDescription.findAll({
        where,
        order: [['posting_date', 'DESC']]
    });
    return {
        status: 200,
        data: {
            error: false,
            jobs
        }
    };
};

export const searchDeletedJobDescriptionsService = async (query = {}) => {
    const {
        title,
        location,
        experience_level
    } = query;

    const where = {};

    if (title) {
        where.title = { [Op.like]: `%${title}%` };
    }
    if (location) {
        where.location = { [Op.like]: `%${location}%` };
    }
    if (experience_level) {
        where.experience_level = { [Op.like]: `%${experience_level}%` };
    }

    where.is_deleted = true;

    const jobs = await JobDescription.findAll({
        where,
        order: [['updated_at', 'DESC'], ['created_at', 'DESC']]
    });
    return {
        status: 200,
        data: {
            error: false,
            jobs
        }
    };
};