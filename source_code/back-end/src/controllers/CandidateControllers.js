import * as candidateService from '../services/CandidateServices.js';
import fs from 'fs/promises';
import path from 'path';
import Candidate from '../models/Candidate.js';
import { sendEmail } from '../utils/sendEmail.js';

export const createCandidate = async (req, res) => {
    try {
        const candidateData = {
            ...req.body,
            cv_file_path: undefined
        };

        const result = await candidateService.createCandidateService(candidateData);

        if (result.status !== 201) {
            return res.status(result.status).json(result.data);
        }

        // Lưu CV    
        if (req.file && req.file.buffer) {
            const uploadsDir = path.join(process.cwd(), 'uploads');
            try {
                await fs.mkdir(uploadsDir, { recursive: true });

                // Lấy họ tên và ngày nộp
                const fullName = (req.body.full_name || 'unknown').replace(/[^a-zA-Z0-9_.-]/g, '_');
                const now = new Date();
                const applyDate = (req.body.apply_date || now.toISOString().slice(0, 10)).replace(/[^0-9\-]/g, '');
                
                // Tạo timestamp để phân biệt CV theo thời gian nộp (giờ:phút:giây)
                const timestamp = now.toTimeString().slice(0, 8).replace(/:/g, '-'); // HH-MM-SS
                const ext = path.extname(req.file.originalname) || '.pdf';

                // Tạo tên file: Họ_và_tên-ngày_nộp-giờ_phút_giây.pdf
                const fileName = `${fullName}-${applyDate}-${timestamp}${ext}`;
                const filePath = path.join(uploadsDir, fileName);

                await fs.writeFile(filePath, req.file.buffer);

                await result.data.candidate.update({ cv_file_path: filePath });
                result.data.candidate.cv_file_path = filePath;
            } catch (error) {
                console.error('Lỗi lưu CV:', error);
            }
        }

        // Gửi email thông báo
        const userEmail = req.body.personal_email;
        
        if (userEmail) {
            const subject = 'Xác nhận nộp CV thành công - Cảm ơn bạn đã ứng tuyển';
            const htmlContent = `
                <h2>Xin chào ${req.body.full_name || 'Ứng viên'},</h2>
                <p>Cảm ơn bạn đã nộp CV ứng tuyển qua hệ thống của chúng tôi.</p>
                <p>Bộ phận nhân sự sẽ xem xét hồ sơ và liên hệ lại với bạn trong thời gian sớm nhất.</p>
                <br/>
                <p>Trân trọng,<br/>Phòng Nhân Sự</p>
            `;
            try {
                await sendEmail(userEmail, subject, htmlContent);
            } catch (error) {
                console.error('Failed to send email:', error);
                // Không trả về lỗi cho client, chỉ log lỗi
            }
        } else {
            console.log('No email address provided, skipping email notification');
        }

        return res.status(result.status).json({
            ...result.data,
            message: "Nộp CV thành công! Vui lòng kiểm tra email để nhận xác nhận."
        });

        } catch (error) {
            console.error("Lỗi tạo candidate:", error);
            return res.status(500).json({ error: true, message: "Internal server error" });
        }
    };

export const getAllCandidates = async (req, res) => {
    try {
        const result = await candidateService.getAllCandidatesService();
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error fetching candidates:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getCandidateById = async (req, res) => {
    try {
        const candidateId = req.params.id;
        const result = await candidateService.getCandidateByIdService(candidateId);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error fetching candidate by ID:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const updateCandidate = async (req, res) => {
    try {
        const candidateId = req.params.id;
        const updateData = req.body;
        const result = await candidateService.updateCandidateService(candidateId, updateData);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error updating candidate:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const deleteCandidate = async (req, res) => {
    try {
        const candidateId = req.params.id;
        const result = await candidateService.deleteCandidateService(candidateId);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error deleting candidate:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const restoreCandidate = async (req, res) => {
    try {
        const candidateId = req.params.id;  
        const result = await candidateService.restoreCandidateService(candidateId);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error restoring candidate:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getDeletedCandidates = async (req, res) => {
    try {
        const result = await candidateService.getDeletedCandidatesService();
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error fetching deleted candidates:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const searchCandidates = async (req, res) => {
    try {
        const query = req.query;
        const result = await candidateService.searchCandidatesService(query);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error searching candidates:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const searchDeletedCandidates = async (req, res) => {
    try {
        const query = req.query;
        const result = await candidateService.searchDeletedCandidatesService(query);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error searching deleted candidates:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const updateCandidateApplication = async (req, res) => {
    try {
        const candidateInfoId = req.params.id;
        const updateData = req.body;
        const result = await candidateService.updateCandidateApplicationService(candidateInfoId, updateData);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error updating candidate application:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};