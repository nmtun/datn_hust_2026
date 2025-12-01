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
            const uploadsDir = path.join(process.cwd(), 'uploads/cvs');
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

export const createCompanyEmail = async (req, res) => {
    try {
        const candidateId = req.params.id;
        const { company_email, password } = req.body;

        // Validation
        if (!company_email || !password) {
            return res.status(400).json({
                error: true,
                message: "Company email and password are required"
            });
        }

        const result = await candidateService.createCompanyEmailService(candidateId, company_email, password);
        
        if (result.status !== 200) {
            return res.status(result.status).json(result.data);
        }

        // Gửi email thông báo company_email và password
        const candidate = result.data.candidate;
        const personalEmail = candidate.personal_email;
        
        if (personalEmail) {
            const subject = 'Chào mừng bạn đến với công ty - Đây là thông tin đăng nhập của bạn';
            const htmlContent = `
                <h2>Chúc mừng ${candidate.full_name}!</h2>
                <p>Tài khoản email công ty của bạn đã được tạo thành công. Bạn có thể truy cập hệ thống công ty với thông tin đăng nhập sau:</p>
                
                <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 0.375rem; padding: 1rem; margin: 1rem 0;">
                    <p><strong>Company Email:</strong> ${company_email}</p>
                    <p><strong>Password:</strong> ${password}</p>
                </div>
                
                <p><strong>Lưu ý bảo mật quan trọng:</strong></p>
                <ul>
                    <li>Vui lòng đổi mật khẩu sau lần đăng nhập đầu tiên</li>
                    <li>Không chia sẻ thông tin đăng nhập với bất kỳ ai</li>
                    <li>Sử dụng email này cho tất cả các liên lạc liên quan đến công việc</li>
                </ul>
                
                <p>Bạn có thể truy cập hệ thống công ty tại: <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login">Hệ thống của công ty</a></p>
                
                <br/>
                <p>Chúc mừng bạn đã trở thành một thành viên của công ty!<br/>Phòng Nhân sự</p>
            `;

            try {
                await sendEmail(personalEmail, subject, htmlContent);
                result.data.message = "Company email created and credentials sent successfully";
            } catch (emailError) {
                console.error('Failed to send company email notification:', emailError);
                result.data.message = "Company email created but failed to send notification email";
            }
        } else {
            result.data.message = "Company email created but no personal email found to send notification";
        }

        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error creating company email:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};