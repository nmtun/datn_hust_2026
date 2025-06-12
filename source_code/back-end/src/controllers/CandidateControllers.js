import * as candidateService from '../services/CandidateServices.js';
import * as userService from '../services/UserServices.js';
import bcrypt from 'bcrypt';

export const createCandidate = async (req, res) => {
    try {
        console.log("DEBUG - req.body:", req.body);
        const {
            personal_email,
            company_email,
            password,
            full_name,
            phone_number,
            address,
            role = "Ứng viên",
            cv_file_path,
            candidate_status,
            source_of_application,
            apply_date,
            evalution,
            notes
        } = req.body;

        // Kiểm tra thông tin bắt buộc
        if (!personal_email) return res.status(400).json({ error: true, message: "Email is required" });
        if (!password) return res.status(400).json({ error: true, message: "Password is required" });
        if (!full_name) return res.status(400).json({ error: true, message: "Full name is required" });
        
        // Kiểm tra xem email đã tồn tại chưa
        const checkUserExists = await userService.findUserByEmail(personal_email);
        if (checkUserExists) {
            return res.status(400).json({ error: true, message: "Email already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo user
        const newUser = await userService.createUser({
            personal_email,
            password: hashedPassword,
            full_name,
            phone_number,
            address,
            role
        });

        // Tạo candidate
        const newCandidate = await candidateService.createCandidate({
            user_id: newUser.user_id,
            cv_file_path,
            candidate_status,
            source_of_application,
            apply_date,
            evalution,
            notes
        });

        res.status(201).json({
            error: false,
            message: "Candidate created successfully",
            candidate: newCandidate,
            user: newUser
        });
    } catch (error) {
        console.error("Error creating candidate:", error);
        res.status(500).json({ error: true, message: "Internal server error" });
    }
};