import '../models/associations.js'; // Import associations trước
import Candidate from '../models/Candidate.js';
import User from '../models/User.js';
import JobDescription from '../models/JobDescription.js';
import * as userService from './UserServices.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Op } from 'sequelize';

export const createCandidateService = async (candidateData) => {
    const {
        personal_email,
        company_email,
        password,
        full_name,
        phone_number,
        address,
        role = "candidate",
        cv_file_path,
        candidate_status,
        source = "website",
        apply_date = new Date(), 
        evaluation,
        job_id,
        cover_letter,
        status = "active"
    } = candidateData;

    const processedCoverLetter = Array.isArray(cover_letter) ? cover_letter.join('\n') : cover_letter;

    // Validate
    if (!personal_email) return { status: 400, data: { error: true, message: "Email is required" } };
    if (!full_name) return { status: 400, data: { error: true, message: "Fullname is required" } };

    // Check user exists thì tạo bản ghi candidate liên kết với user đó 
    const existingUser = await userService.findUserByEmailService(personal_email);

    if (existingUser) {
        // Kiểm tra xem user đã ứng tuyển job này hay chưa
        const existingJobApplication = await Candidate.findOne({
            where: {
                user_id: existingUser.user_id,
                job_id: job_id
            }
        });
        // Kiểm tra xem user này đã có bản ghi candidate có status = hired thì không cho ứng tuyển lại
        const hiredApplication = await Candidate.findOne({
            where: {
                user_id: existingUser.user_id,
                candidate_status: "hired"
            }
        });
        if (existingJobApplication) {
            return {
                status: 400,
                data: {
                    error: true,
                    message: "Bạn đã ứng tuyển vào vị trí này trước đó. Vui lòng chọn vị trí khác hoặc liên hệ bộ phận tuyển dụng để biết thêm thông tin."
                }
            };
        } else if (hiredApplication) {
            return {
                status: 400,
                data: {
                    error: true,
                    message: "Email đã được sử dụng bởi thành viên của công ty, không thể ứng tuyển lại."
                }
            };
        } else {
            // Tạo bản ghi candidate liên kết với user đã tồn tại
            const newCandidate = await Candidate.create({
                user_id: existingUser.user_id,
                cv_file_path,
                candidate_status,
                source,
                apply_date,
                evaluation,
                job_id,
                cover_letter: processedCoverLetter
            });
            return {
                status: 201,
                data: {
                    error: false,
                    message: "Candidate created successfully",
                    candidate: newCandidate,
                    user: existingUser,
                    temp_password_generated: false
                }
            };
        }
    } else {
        // Tạo password tạm nếu chưa có
        let rawPassword = password;
        if (!rawPassword) {
            rawPassword = crypto.randomBytes(6).toString('base64');
        }
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        // Tạo user
        const newUser = await userService.createUserService({
            personal_email,
            company_email,
            password: hashedPassword,
            full_name,
            phone_number,
            address,
            role,
            status
        });

        // Tạo candidate
        const newCandidate = await Candidate.create({
            user_id: newUser.user_id,
            cv_file_path,
            candidate_status,
            source: "website",
            apply_date,
            evaluation,
            job_id,
            cover_letter: processedCoverLetter
        });

        return {
            status: 201,
            data: {
                error: false,
                message: "Candidate created successfully",
                candidate: newCandidate,
                user: newUser,
                temp_password_generated: !password ? true : false
            }
        };
    }

};

export const getAllCandidatesService = async () => {
    // join bảng User, Candidate và JobDescription để lấy thông tin ứng viên cùng với thông tin công việc đã ứng tuyển
    try {
        const candidates = await User.findAll({
            where: {
                role: 'candidate', // Chỉ lấy user có role là candidate
                is_deleted: false // Chỉ lấy user chưa bị xóa
            },
            include: [
                {
                    model: Candidate,
                    required: false, // LEFT JOIN - bao gồm cả users không có candidate info
                    attributes: ['candidate_info_id', 'cv_file_path', 'candidate_status', 'source', 'apply_date', 'evaluation', 'cover_letter', 'job_id'],
                    include: [
                        {
                            model: JobDescription,
                            required: false, // LEFT JOIN - bao gồm cả candidate info không có job description
                            attributes: ['job_id', 'title', 'experience_level', 'employment_type']
                        }
                    ]
                }
            ],
            attributes: ['user_id', 'personal_email', 'full_name', 'phone_number', 'address', 'status', 'password'],
            order: [['created_at', 'DESC']]
        });
        return {
            status: 200,
            data: {
                error: false,
                message: "Get all candidates successfully",
                candidates
            }
        };
    } catch (error) {
        console.error('Error in getAllCandidatesService:', error);
        return {
            status: 500,
            data: {
                error: true,
                message: "Internal server error",
                details: error.message
            }
        };
    }
};

export const getCandidateByIdService = async (userId) => {
    try {
        const candidate = await User.findOne({
            where: { 
                user_id: userId,
                role: 'candidate' 
            },
            include: [
                {
                    model: Candidate,
                    attributes: ['candidate_info_id', 'cv_file_path', 'candidate_status', 'source', 'apply_date', 'evaluation', 'cover_letter', 'job_id'],
                    include: [
                        {
                            model: JobDescription,
                            attributes: ['job_id', 'title', 'experience_level', 'employment_type']
                        }
                    ]
                }
            ],
            attributes: ['user_id', 'personal_email', 'full_name', 'phone_number', 'address', 'status', 'password'],

        });
        if (!candidate) {
            return {
                status: 404,
                data: {
                    error: true,
                    message: "Candidate not found"
                }
            };
        }
        return {
            status: 200,
            data: {
                error: false,
                message: "Get candidate by ID successfully",
                candidate
            }
        };
    } catch (error) {
        console.error('Error in getCandidateByIdService:', error);
        return {
            status: 500,
            data: {
                error: true,
                message: "Internal server error",
                details: error.message
            }
        };
    }
};  

export const updateCandidateService = async (userId, updateData) => {
    try {
        const user = await User.findOne({ 
            where: { 
                user_id: userId, 
                role: 'candidate' 
            } 
        });
        
        if (!user) {
            return {
                status: 404,
                data: {
                    error: true,
                    message: "Candidate not found"
                }
            };
        }

        const candidate = await Candidate.findOne({ where: { user_id: userId } });
        if (!candidate) {
            return {
                status: 404,
                data: {
                    error: true,
                    message: "Candidate not found"
                }
            };
        }

        // Phân tách dữ liệu cho User và Candidate
        const userFields = ['personal_email', 'company_email', 'full_name', 'phone_number', 'address', 'status', 'password'];
        const candidateFields = ['cv_file_path', 'candidate_status', 'source', 'apply_date', 'evaluation', 'job_id', 'cover_letter'];

        const userUpdateData = {};
        const candidateUpdateData = {};

        // Phân loại dữ liệu update
        Object.keys(updateData).forEach(key => {
            if (userFields.includes(key)) {
                userUpdateData[key] = updateData[key];
            } else if (candidateFields.includes(key)) {
                candidateUpdateData[key] = updateData[key];
            }
        });

        // Xử lý password nếu có
        if (userUpdateData.password) {
            userUpdateData.password = await bcrypt.hash(userUpdateData.password, 10);
        }

        // Xử lý cover_letter nếu là array
        if (candidateUpdateData.cover_letter && Array.isArray(candidateUpdateData.cover_letter)) {
            candidateUpdateData.cover_letter = candidateUpdateData.cover_letter.join('\n');
        }

        // Update User nếu có dữ liệu
        if (Object.keys(userUpdateData).length > 0) {
            await user.update(userUpdateData);
        }

        // Update Candidate nếu có dữ liệu
        if (Object.keys(candidateUpdateData).length > 0) {
            await candidate.update(candidateUpdateData);
        }

        // Lấy dữ liệu đã update để trả về
        const updatedCandidate = await User.findOne({
            where: { 
                user_id: userId,
                role: 'candidate' 
            },
            include: [
                {
                    model: Candidate,
                    attributes: ['candidate_info_id', 'cv_file_path', 'candidate_status', 'source', 'apply_date', 'evaluation', 'cover_letter', 'job_id'],
                    include: [
                        {
                            model: JobDescription,
                            attributes: ['job_id', 'title', 'experience_level', 'employment_type']
                        }
                    ]
                }
            ],
            attributes: ['user_id', 'personal_email', 'full_name', 'phone_number', 'address', 'status'],
        });

        return {
            status: 200,
            data: {
                error: false,
                message: "Candidate updated successfully",
                candidate: updatedCandidate
            }
        };
    } catch (error) {
        console.error('Error in updateCandidateService:', error);
        return {
            status: 500,
            data: {
                error: true,
                message: "Internal server error",
                details: error.message
            }
        };
    }
};

export const deleteCandidateService = async (userId) => {
    try {
        const user = await User.findOne({
            where: { 
                user_id: userId,
                role: 'candidate' 
            } 
        });
        if (!user) {
            return {
                status: 404,
                data: {
                    error: true,
                    message: "Candidate not found"
                }
            };
        }
        await user.update({ is_deleted: true });
        return {
            status: 200,
            data: {
                error: false,
                message: "Candidate deleted successfully"
            }
        };
    } catch (error) {
        console.error('Error in deleteCandidateService:', error);
        return {
            status: 500,
            data: {
                error: true,
                message: "Internal server error",
                details: error.message
            }
        };
    }
};

export const getDeletedCandidatesService = async () => {
    try {
        const candidates = await User.findAll({
            where: { 
                role: 'candidate',
                is_deleted: true
            },
            include: [
                {
                    model: Candidate,
                    attributes: ['candidate_info_id', 'cv_file_path', 'candidate_status', 'source', 'apply_date', 'evaluation', 'cover_letter', 'job_id'],
                    include: [
                        {
                            model: JobDescription,
                            attributes: ['job_id', 'title', 'experience_level', 'employment_type']
                        }
                    ]
                }   
            ],
            attributes: ['user_id', 'personal_email', 'full_name', 'phone_number', 'address', 'status', 'password'],
            order: [['created_at', 'DESC']]
        });
        return {
            status: 200,
            data: {
                error: false,
                message: "Get all deleted candidates successfully", 
                candidates
            }
        };
    } catch (error) {
        console.error('Error in getAllDeletedCandidatesService:', error);
        return {
            status: 500,
            data: {
                error: true,
                message: "Internal server error",
                details: error.message
            }
        };
    }
};

export const restoreCandidateService = async (userId) => {
    try {
        const user = await User.findOne({
            where: { 
                user_id: userId,
                role: 'candidate'
            } 
        });
        if (!user) {
            return {
                status: 404,
                data: {
                    error: true,
                    message: "Candidate not found"
                }
            };
        }
        await user.update({ status: 'active', is_deleted: false });
        return {
            status: 200,
            data: {
                error: false,
                message: "Candidate restored successfully"
            }
        };
    } catch (error) {
        console.error('Error in restoreCandidateService:', error);
        return {
            status: 500,
            data: {
                error: true,
                message: "Internal server error",
                details: error.message
            }
        };
    }
};

export const searchCandidatesService = async (query = {}) => {
    try {
        const {
            full_name,
            personal_email,
            candidate_status
        } = query;

        let userWhere = {
            role: 'candidate',
            is_deleted: false
        };

        let candidateWhere = {};

        // Điều kiện tìm kiếm cho User
        if (full_name) {
            userWhere.full_name = { [Op.like]: `%${full_name}%` };
        }
        if (personal_email) {
            userWhere.personal_email = { [Op.like]: `%${personal_email}%` };
        }

        // Điều kiện tìm kiếm cho Candidate
        if (candidate_status) {
            candidateWhere.candidate_status = candidate_status;
        }

        const candidates = await User.findAll({
            where: userWhere,
            include: [
                {
                    model: Candidate,
                    where: Object.keys(candidateWhere).length > 0 ? candidateWhere : undefined,
                    attributes: ['candidate_info_id', 'cv_file_path', 'candidate_status', 'source', 'apply_date', 'evaluation', 'cover_letter', 'job_id'],
                    include: [
                        {
                            model: JobDescription,
                            attributes: ['job_id', 'title', 'experience_level', 'employment_type']
                        }
                    ]
                }
            ],
            attributes: ['user_id', 'personal_email', 'full_name', 'phone_number', 'address', 'status'],
            order: [['created_at', 'DESC']]
        });
        
        return {
            status: 200,
            data: {
                error: false,
                message: "Candidates retrieved successfully",
                candidates
            }
        };
    } catch (error) {
        console.error('Error in searchCandidatesService:', error);
        return {
            status: 500,
            data: {
                error: true,
                message: "Internal server error",
                details: error.message
            }
        };
    }
};

export const searchDeletedCandidatesService = async (query = {}) => {
    try {
        const {
            full_name,
            personal_email,
            candidate_status
        } = query;

        let userWhere = {
            role: 'candidate',
            is_deleted: true
        };

        let candidateWhere = {};

        // Điều kiện tìm kiếm cho User
        if (full_name) {
            userWhere.full_name = { [Op.like]: `%${full_name}%` };
        }
        if (personal_email) {
            userWhere.personal_email = { [Op.like]: `%${personal_email}%` };
        }

        // Điều kiện tìm kiếm cho Candidate
        if (candidate_status) {
            candidateWhere.candidate_status = candidate_status;
        }

        const candidates = await User.findAll({
            where: userWhere,
            include: [
                {
                    model: Candidate,
                    where: Object.keys(candidateWhere).length > 0 ? candidateWhere : undefined,
                    attributes: ['candidate_info_id', 'cv_file_path', 'candidate_status', 'source', 'apply_date', 'evaluation', 'cover_letter', 'job_id'],
                    include: [
                        {
                            model: JobDescription,
                            attributes: ['job_id', 'title', 'experience_level', 'employment_type']
                        }
                    ]
                }
            ],
            attributes: ['user_id', 'personal_email', 'full_name', 'phone_number', 'address', 'status'],
            order: [['created_at', 'DESC']]
        });
        
        return {
            status: 200,
            data: {
                error: false,
                message: "Deleted candidates retrieved successfully",
                candidates
            }
        };
    } catch (error) {
        console.error('Error in searchDeletedCandidatesService:', error);
        return {
            status: 500,
            data: {
                error: true,
                message: "Internal server error",
                details: error.message
            }
        };
    }
};

export const updateCandidateApplicationService = async (candidateInfoId, updateData) => {
    try {
        const candidateInfo = await Candidate.findOne({
            where: { 
                candidate_info_id: candidateInfoId 
            }
        });

        if (!candidateInfo) {
            return {
                status: 404,
                data: {
                    error: true,
                    message: "Candidate application not found"
                }
            };
        }

        // Xử lý cover_letter nếu là array
        if (updateData.cover_letter && Array.isArray(updateData.cover_letter)) {
            updateData.cover_letter = updateData.cover_letter.join('\n');
        }

        // Cập nhật candidate info
        await candidateInfo.update(updateData);

        // Lấy dữ liệu đã cập nhật
        const updatedCandidateInfo = await Candidate.findOne({
            where: { 
                candidate_info_id: candidateInfoId 
            },
            include: [
                {
                    model: JobDescription,
                    attributes: ['job_id', 'title', 'experience_level', 'employment_type']
                }
            ]
        });

        return {
            status: 200,
            data: {
                error: false,
                message: "Candidate application updated successfully",
                candidateInfo: updatedCandidateInfo
            }
        };
    } catch (error) {
        console.error('Error in updateCandidateApplicationService:', error);
        return {
            status: 500,
            data: {
                error: true,
                message: "Internal server error",
                details: error.message
            }
        };
    }
};

export const createCompanyEmailService = async (candidateId, companyEmail, password) => {
    try {
        // Kiểm tra candidate exists
        const candidate = await User.findOne({
            where: { 
                user_id: candidateId,
                is_deleted: false 
            },
            include: [
                {
                    model: Candidate,
                    where: { candidate_status: 'hired' },
                    include: [
                        {
                            model: JobDescription,
                            attributes: ['job_id', 'title', 'experience_level', 'employment_type']
                        }
                    ]
                }
            ]
        });

        if (!candidate) {
            return {
                status: 404,
                data: {
                    error: true,
                    message: "Hired candidate not found"
                }
            };
        }

        // Kiểm tra company_email đã tồn tại chưa
        const existingEmailUser = await User.findOne({
            where: { 
                company_email: companyEmail,
                is_deleted: false 
            }
        });

        if (existingEmailUser) {
            return {
                status: 400,
                data: {
                    error: true,
                    message: "Company email already exists"
                }
            };
        }

        // Kiểm tra candidate đã có company_email chưa
        if (candidate.company_email) {
            return {
                status: 400,
                data: {
                    error: true,
                    message: "Candidate already has a company email"
                }
            };
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Cập nhật candidate với company_email và role thành employee
        await candidate.update({
            company_email: companyEmail,
            password: hashedPassword, // Cập nhật password mới cho company email
            role: 'employee' // Chuyển role từ candidate thành employee
        });

        // Lấy dữ liệu đã cập nhật
        const updatedCandidate = await User.findOne({
            where: { user_id: candidateId },
            attributes: { exclude: ['password'] }, // Không trả về password
            include: [
                {
                    model: Candidate,
                    where: { candidate_status: 'hired' },
                    include: [
                        {
                            model: JobDescription,
                            attributes: ['job_id', 'title', 'experience_level', 'employment_type']
                        }
                    ]
                }
            ]
        });

        return {
            status: 200,
            data: {
                error: false,
                message: "Company email created successfully",
                candidate: updatedCandidate
            }
        };
    } catch (error) {
        console.error('Error in createCompanyEmailService:', error);
        return {
            status: 500,
            data: {
                error: true,
                message: "Internal server error",
                details: error.message
            }
        };
    }
};