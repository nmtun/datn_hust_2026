import Candidate from '../models/Candidate.js';
import User from '../models/User.js';
import JobDescription from '../models/JobDescription.js';
import * as userService from './UserServices.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

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
        source,
        apply_date,
        evaluation,
        job_id,
        notes,
        status = "active"
    } = candidateData;

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
        if (existingJobApplication) {
            return {
                status: 400,
                data: {
                    error: true,
                    message: "Bạn đã ứng tuyển vào vị trí này trước đó. Vui lòng chọn vị trí khác hoặc liên hệ bộ phận tuyển dụng để biết thêm thông tin."
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
                notes
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
            source,
            apply_date,
            evaluation,
            job_id,
            notes
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
                role: 'candidate' // Chỉ lấy user có role là candidate
            },
            include: [
                {
                    model: Candidate,
                    attributes: ['candidate_info_id', 'cv_file_path', 'candidate_status', 'source', 'apply_date', 'evaluation', 'notes', 'job_id'],
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