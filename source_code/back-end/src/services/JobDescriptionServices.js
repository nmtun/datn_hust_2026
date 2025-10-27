import JobDescription from "../models/JobDescription.js";
import { Op } from "sequelize";

export const createJobDescription = async (jobData, user) => {
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

export const getAllJobDescriptions = async () => {
    const jobs = await JobDescription.findAll();
    return {
        status: 200,
        data: {
            error: false,
            jobs
        }
    };
};

export const getJobDescriptionById = async (jobId) => {
    const job = await JobDescription.findByPk(jobId);
    return {
        status: 200,
        data: {
            error: false,
            job
        }
    };
};

export const updateJobDescription = async (jobId, jobData) => {
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

export const deleteJobDescription = async (jobId) => {
    const job = await JobDescription.findByPk(jobId);
    if (!job) {
        return { status: 404, data: { error: true, message: "Job description not found" } };
    }

    await job.destroy();
    return {
        status: 200,
        data: {
            error: false,
            message: "Job description deleted successfully"
        }
    };
};


export const searchJobDescriptions = async (filters = {}) => {
    const {
        title,
        location,
        type_of_work,
        experience_level,
        employment_type,
        status,
        salary_range_min,
        salary_range_max,
        page = 1,
        pageSize = 10
    } = filters;

    const where = {};

    if (title) {
        where.title = { [Op.substring]: `%${title}%` };
    }
    if (location) {
        where.location = { [Op.substring]: `%${location}%` };
    }
    if (type_of_work) {
        where.type_of_work = { [Op.substring]: `%${type_of_work}%` };
    }
    if (experience_level) {
        where.experience_level = { [Op.substring]: `%${experience_level}%` };
    }
    if (employment_type) {
        where.employment_type = { [Op.substring]: `%${employment_type}%` };
    }
    if (status) {
        where.status = { [Op.substring]: `%${status}%` };
    }
    if (salary_range_min) {
        where.salary_range_min = { [Op.gte]: salary_range_min };
    }
    if (salary_range_max) {
        where.salary_range_max = { [Op.lte]: salary_range_max };
    }

    const offset = (page - 1) * pageSize;

    const {rows, count} = await JobDescription.findAndCountAll({
        where,
        limit: pageSize,
        offset,
        order: [['posting_date', 'DESC']]
    });

    const jobs = rows;
    return {
        status: 200,
        data: {
            error: false,
            jobs
        }
    };
}