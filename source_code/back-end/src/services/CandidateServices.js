import Candidate from '../models/Candidate.js';
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
    if (!full_name) return { status: 400, data: { error: true, message: "Full name is required" } };

    // Check email 
    // const checkUserExists = await userService.findUserByEmail(personal_email);
    // if (checkUserExists) {
    //     return { status: 400, data: { error: true, message: "Email already exists" } };
    // }

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
};

export const getAllCandidatesService = async () => {
    const candidates = await Candidate.findAll();
    return {
        status: 200,
        data: {
            error: false,
            candidates
        }
    };
};