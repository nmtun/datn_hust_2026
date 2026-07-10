import '../models/associations.js';
import Candidate from '../models/Candidate.js';
import User from '../models/User.js';
import JobDescription from '../models/JobDescription.js';
import Department from '../models/Department.js';
import Employee from '../models/Employee.js';
import Tenant from '../models/Tenant.js';
import * as userService from './UserServices.js';
import { createNotificationsForUsers } from './NotificationServices.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Op } from 'sequelize';
import { runWithRequestContext } from '../utils/requestContext.js';
import { requireTenantId, resolveTenantId, withTenantWhere } from '../utils/tenantScope.js';
import { sendEmail } from '../utils/sendEmail.js';

const POSITION_BY_EXPERIENCE_LEVEL = {
    intern: 'Thực tập sinh',
    fresher: 'Nhân viên tập sự',
    mid: 'Chuyên viên',
    senior: 'Chuyên viên cao cấp',
    manager: 'Quản lý'
};

const resolveEmployeePositionFromJob = (job) => {
    if (!job) return 'Nhân viên';

    const basePosition = POSITION_BY_EXPERIENCE_LEVEL[job.experience_level] || 'Nhân viên';
    if (job.employment_type === 'part-time' && basePosition !== 'Quản lý') {
        return `${basePosition} bán thời gian`;
    }

    return basePosition;
};

const normalizeTextForComparison = (value = '') => value
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const isHrDepartment = (department) => {
    if (!department) return false;

    const normalizedCode = normalizeTextForComparison(department.code).replace(/[^a-z0-9]/g, '');
    const normalizedName = normalizeTextForComparison(department.name).replace(/\s+/g, ' ').trim();

    if (['hr', 'humanresource', 'humanresources', 'nhansu'].includes(normalizedCode)) {
        return true;
    }

    return normalizedName.includes('nhan su') || normalizedName.includes('human resource');
};

const isTruthyFlag = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
    }
    return false;
};

const CANDIDATE_STATUS_LABELS = {
    new: 'Mới nộp hồ sơ',
    screening: 'Đang sàng lọc',
    interview: 'Mời phỏng vấn',
    offered: 'Gửi đề nghị nhận việc',
    rejected: 'Từ chối',
    hired: 'Đã tuyển'
};

const formatInterviewTime = (interviewTime) => {
    const date = new Date(interviewTime);
    if (Number.isNaN(date.getTime())) return null;

    return date.toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour12: false,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatCurrencyVnd = (amount) => {
    const normalizedAmount = Number(amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) return null;

    return new Intl.NumberFormat('vi-VN').format(normalizedAmount);
};

const sendCandidateStatusEmail = async ({
    personalEmail,
    fullName,
    jobTitle,
    status,
    interviewTime,
    basicSalary
}) => {
    if (!personalEmail) return;

    const safeFullName = fullName || 'Ứng viên';
    const safeJobTitle = jobTitle || 'vị trí đã ứng tuyển';
    const statusLabel = CANDIDATE_STATUS_LABELS[status] || 'Cập nhật hồ sơ';
    const subject = `Cập nhật trạng thái hồ sơ ứng tuyển: ${statusLabel}`;

    const statusContentByType = {
        new: `
            <p>Cảm ơn bạn đã quan tâm và ứng tuyển vị trí <strong>${safeJobTitle}</strong>.</p>
            <p>Chúng tôi đã tiếp nhận hồ sơ của bạn thành công. Hồ sơ sẽ được chuyển đến bộ phận tuyển dụng để xem xét trong thời gian sớm nhất.</p>
            <p>Chúng tôi sẽ cập nhật kết quả đến bạn ngay khi có tiến triển mới.</p>
        `,

        screening: `
            <p>Hồ sơ ứng tuyển của bạn cho vị trí <strong>${safeJobTitle}</strong> hiện đang được đội ngũ tuyển dụng xem xét và đánh giá.</p>
            <p>Chúng tôi đang đối chiếu thông tin, kinh nghiệm và kỹ năng của bạn với yêu cầu của vị trí tuyển dụng.</p>
            <p>Rất mong bạn kiên nhẫn chờ đợi. Chúng tôi sẽ liên hệ với bạn ngay khi có kết quả.</p>
        `,

        interview: `
            <p>Xin chúc mừng! Hồ sơ của bạn đã vượt qua vòng sàng lọc ban đầu.</p>
            <p>Chúng tôi trân trọng kính mời bạn tham gia buổi phỏng vấn cho vị trí <strong>${safeJobTitle}</strong>.</p>
            <p><strong>Thời gian phỏng vấn:</strong> ${interviewTime}</p>
            <p>Vui lòng xác nhận hoặc chuẩn bị tham gia đúng thời gian để buổi phỏng vấn diễn ra thuận lợi.</p>
        `,

        offered: `
            <p>Xin chúc mừng! Bạn đã hoàn thành thành công quá trình tuyển dụng cho vị trí <strong>${safeJobTitle}</strong>.</p>
            <p>Chúng tôi rất vui được gửi đến bạn đề nghị nhận việc với các thông tin cơ bản như sau:</p>
            <p><strong>Mức lương cơ bản đề xuất:</strong> ${basicSalary} VND/tháng</p>
            <p>Bộ phận Nhân sự sẽ sớm liên hệ với bạn để trao đổi chi tiết về quyền lợi, thời gian nhận việc và các thủ tục cần thiết.</p>
        `,

            rejected: `
            <p>Cảm ơn bạn đã dành thời gian và sự quan tâm đến vị trí <strong>${safeJobTitle}</strong>.</p>
            <p>Sau quá trình xem xét kỹ lưỡng, rất tiếc hồ sơ của bạn chưa phù hợp với yêu cầu của vị trí tuyển dụng ở thời điểm hiện tại.</p>
            <p>Chúng tôi đánh giá cao những nỗ lực của bạn và hy vọng sẽ có cơ hội đồng hành cùng bạn trong những vị trí phù hợp hơn trong tương lai.</p>
            <p>Chúc bạn nhiều thành công trên con đường sự nghiệp.</p>
        `,

        hired: `
            <p><strong>Xin chúc mừng!</strong></p>
            <p>Bạn đã chính thức trở thành thành viên của đội ngũ chúng tôi với vị trí <strong>${safeJobTitle}</strong>.</p>
            <p>Bộ phận Nhân sự sẽ sớm liên hệ để hướng dẫn hoàn tất các thủ tục tiếp nhận, ký kết hợp đồng và lịch trình nhận việc.</p>
            <p>Chúng tôi rất mong được đồng hành cùng bạn trong chặng đường sắp tới.</p>
        `
    };

    const htmlContent = `
        <h2>Xin chào ${safeFullName},</h2>

        ${statusContentByType[status] || `
            <p>Trạng thái hồ sơ ứng tuyển của bạn cho vị trí <strong>${safeJobTitle}</strong> đã được cập nhật.</p>
        `}

        <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />

        <p><strong>Trạng thái hiện tại:</strong> ${statusLabel}</p>

        <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng phản hồi email này hoặc liên hệ với bộ phận Nhân sự để được hỗ trợ.</p>

        <br/>

        <p>
            Trân trọng,<br/>
            <strong>Phòng Nhân sự</strong><br/>
            <strong>TechCom</strong>
        </p>
    `;

    await sendEmail(personalEmail, subject, htmlContent);
};

const getEmployeeInfoInclude = () => ({
    model: Employee,
    as: 'Employee_Info',
    required: false,
    where: withTenantWhere({}),
    attributes: ['employee_info_id', 'position', 'department_id', 'team_id', 'manager_id', 'hire_date']
});

const sendHrNotificationForNewApplication = async ({ candidate, candidateUser, candidateData, tenantId }) => {
    try {
        const jobId = Number(candidate?.job_id ?? candidateData?.job_id);
        if (!Number.isInteger(jobId) || jobId <= 0) return;

        const job = await JobDescription.findOne({
            where: withTenantWhere({ job_id: jobId }),
            attributes: ['job_id', 'title', 'created_by', 'department_id'],
            include: [
                {
                    model: Department,
                    as: 'department',
                    attributes: ['department_id', 'name', 'code'],
                    required: false
                }
            ]
        });

        if (!job?.created_by) return;

        const hrCreator = await User.findOne({
            where: withTenantWhere({
                user_id: job.created_by,
                role: 'hr',
                is_deleted: false
            }),
            attributes: ['user_id']
        });

        if (!hrCreator) return;

        const actorIdRaw = Number(candidate?.user_id ?? candidateUser?.user_id);
        const actorId = Number.isInteger(actorIdRaw) && actorIdRaw > 0 ? actorIdRaw : null;
        const candidateName = candidateUser?.full_name || candidateData?.full_name || 'Ứng viên';
        const candidateInfoIdRaw = Number(candidate?.candidate_info_id);
        const candidateInfoId = Number.isInteger(candidateInfoIdRaw) && candidateInfoIdRaw > 0 ? candidateInfoIdRaw : null;

        const notificationPayload = {
            recipientIds: [hrCreator.user_id],
            actorId,
            title: 'Có ứng viên mới ứng tuyển',
            message: `${candidateName} vừa nộp CV cho vị trí ${job.title || 'không xác định'}${job.department?.name ? ` - Phòng ban ${job.department.name}` : ''}.`,
            entityType: 'candidate',
            entityId: candidateInfoId,
            metadata: {
                job_id: job.job_id,
                job_title: job.title,
                department_id: job.department_id || null,
                department_name: job.department?.name || null,
                candidate_user_id: actorId,
                candidate_info_id: candidateInfoId,
                source: candidate?.source || candidateData?.source || 'website'
            },
            tenantId
        };

        try {
            await createNotificationsForUsers({
                ...notificationPayload,
                type: 'candidate_applied'
            });
        } catch (error) {
            // Fallback cho DB cũ chưa thêm enum candidate_applied.
            console.error('Candidate notification type fallback triggered:', error);
            await createNotificationsForUsers({
                ...notificationPayload,
                type: 'task_updated'
            });
        }
    } catch (error) {
        console.error('Failed to send HR notification for new application:', error);
    }
};

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
        evaluation_comment,
        job_id,
        cover_letter,
        status = "active"
    } = candidateData;

    const processedCoverLetter = Array.isArray(cover_letter) ? cover_letter.join('\n') : cover_letter;
    const isHrCreated = isTruthyFlag(candidateData?.created_by_hr);

    // Validate
    if (!personal_email) return { status: 400, data: { error: true, message: "Email is required" } };
    if (!full_name) return { status: 400, data: { error: true, message: "Fullname is required" } };
    if (job_id == null || job_id === '') return { status: 400, data: { error: true, message: "Vui lòng chọn vị trí ứng tuyển" } };

    const normalizedJobId = Number(job_id);
    if (!Number.isInteger(normalizedJobId) || normalizedJobId <= 0) {
        return { status: 400, data: { error: true, message: "Mã vị trí ứng tuyển không hợp lệ" } };
    }

    const selectedJob = await JobDescription.findOne({
        where: {
            job_id: normalizedJobId,
            is_deleted: false
        },
        attributes: ['job_id', 'title', 'department_id', 'tenant_id'],
        include: [
            {
                model: Department,
                as: 'department',
                attributes: ['department_id', 'name', 'code'],
                required: false
            }
        ]
    });

    if (!selectedJob) {
        return { status: 404, data: { error: true, message: "Vị trí ứng tuyển không tồn tại" } };
    }

    const resolvedTenantIdRaw = selectedJob.tenant_id ?? null;
    const resolvedTenantId = Number(resolvedTenantIdRaw);
    if (!Number.isInteger(resolvedTenantId) || resolvedTenantId <= 0) {
        return { status: 400, data: { error: true, message: "Không xác định được tenant cho vị trí ứng tuyển" } };
    }

    const appliedJob = {
        job_id: selectedJob.job_id,
        title: selectedJob.title,
        department_id: selectedJob.department_id || null,
        department_name: selectedJob.department?.name || null,
        department_code: selectedJob.department?.code || null
    };

    const createCandidateWithContext = async () => {
        // Check user exists thì tạo bản ghi candidate liên kết với user đó
        const existingUser = await userService.findUserByEmailService(personal_email);

        if (existingUser) {
            if (existingUser.role === 'super_admin') {
                return {
                    status: 409,
                    data: {
                        error: true,
                        message: "Email thuộc tài khoản hệ thống, không thể ứng tuyển"
                    }
                };
            }
            if (existingUser.tenant_id && existingUser.tenant_id !== resolvedTenantId) {
                return {
                    status: 409,
                    data: {
                        error: true,
                        message: "Email đã thuộc tenant khác, không thể ứng tuyển vào tenant này"
                    }
                };
            }

            if (!existingUser.tenant_id && existingUser.role !== 'super_admin') {
                await existingUser.update({ tenant_id: resolvedTenantId });
            }
            // Kiểm tra xem user đã ứng tuyển job này hay chưa
            const existingJobApplication = await Candidate.findOne({
                where: withTenantWhere({
                    user_id: existingUser.user_id,
                    job_id: normalizedJobId
                })
            });
            // Kiểm tra xem user này đã có bản ghi candidate có status = hired thì không cho ứng tuyển lại
            const hiredApplication = await Candidate.findOne({
                where: withTenantWhere({
                    user_id: existingUser.user_id,
                    candidate_status: "hired"
                })
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
                    tenant_id: resolvedTenantId,
                    user_id: existingUser.user_id,
                    cv_file_path,
                    candidate_status,
                    source,
                    apply_date,
                    evaluation,
                    evaluation_comment,
                    job_id: normalizedJobId,
                    cover_letter: processedCoverLetter
                });

                if (!isHrCreated) {
                    await sendHrNotificationForNewApplication({
                        candidate: newCandidate,
                        candidateUser: existingUser,
                        candidateData,
                        tenantId: resolvedTenantId
                    });
                }

                return {
                    status: 201,
                    data: {
                        error: false,
                        message: "Candidate created successfully",
                        candidate: newCandidate,
                        applied_job: appliedJob,
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
                tenant_id: resolvedTenantId,
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
                tenant_id: resolvedTenantId,
                user_id: newUser.user_id,
                cv_file_path,
                candidate_status,
                source,
                apply_date,
                evaluation,
                evaluation_comment,
                job_id: normalizedJobId,
                cover_letter: processedCoverLetter
            });

            if (!isHrCreated) {
                await sendHrNotificationForNewApplication({
                    candidate: newCandidate,
                    candidateUser: newUser,
                    candidateData,
                    tenantId: resolvedTenantId
                });
            }

            return {
                status: 201,
                data: {
                    error: false,
                    message: "Candidate created successfully",
                    candidate: newCandidate,
                    applied_job: appliedJob,
                    user: newUser,
                    temp_password_generated: !password ? true : false
                }
            };
        }
    };

    const contextTenantIdRaw = resolveTenantId();
    if (contextTenantIdRaw !== null) {
        const contextTenantId = Number(contextTenantIdRaw);
        if (!Number.isInteger(contextTenantId) || contextTenantId <= 0 || contextTenantId !== resolvedTenantId) {
            return {
                status: 403,
                data: { error: true, message: "Tenant mismatch" }
            };
        }

        return createCandidateWithContext();
    }

    return runWithRequestContext({ tenantId: resolvedTenantId, role: 'candidate', userId: null }, createCandidateWithContext);

};

export const getAllCandidatesService = async () => {
    // join bảng User, Candidate và JobDescription để lấy thông tin ứng viên cùng với thông tin công việc đã ứng tuyển
    try {
        const tenantResult = requireTenantId();
        if (!tenantResult.ok) {
            return { status: 400, data: { error: true, message: "Tenant id is required" } };
        }

        const userWhere = {
            role: 'candidate',
            is_deleted: false
        };

        const candidates = await User.findAll({
            where: withTenantWhere(userWhere),
            include: [
                {
                    model: Candidate,
                    required: false, // LEFT JOIN - bao gồm cả users không có candidate info
                    where: withTenantWhere({}),
                    attributes: ['candidate_info_id', 'cv_file_path', 'candidate_status', 'source', 'apply_date', 'evaluation', 'evaluation_comment', 'cover_letter', 'job_id'],
                    include: [
                        {
                            model: JobDescription,
                            required: false, // LEFT JOIN - bao gồm cả candidate info không có job description
                            attributes: ['job_id', 'title', 'experience_level', 'employment_type']
                        }
                    ]
                },
                getEmployeeInfoInclude()
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
        const tenantResult = requireTenantId();
        if (!tenantResult.ok) {
            return { status: 400, data: { error: true, message: "Tenant id is required" } };
        }

        const candidate = await User.findOne({
            where: withTenantWhere({
                user_id: userId,
                role: 'candidate'
            }),
            include: [
                {
                    model: Candidate,
                    required: false,
                    where: withTenantWhere({}),
                    attributes: ['candidate_info_id', 'cv_file_path', 'candidate_status', 'source', 'apply_date', 'evaluation', 'evaluation_comment', 'cover_letter', 'job_id'],
                    include: [
                        {
                            model: JobDescription,
                            attributes: ['job_id', 'title', 'experience_level', 'employment_type']
                        }
                    ]
                },
                getEmployeeInfoInclude()
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
        const tenantResult = requireTenantId();
        if (!tenantResult.ok) {
            return { status: 400, data: { error: true, message: "Tenant id is required" } };
        }

        const user = await User.findOne({
            where: withTenantWhere({
                user_id: userId,
                role: 'candidate'
            })
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

        const candidate = await Candidate.findOne({
            where: withTenantWhere({ user_id: userId })
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

        // Phân tách dữ liệu cho User và Candidate
        const userFields = ['personal_email', 'company_email', 'full_name', 'phone_number', 'address', 'status', 'password'];
        const candidateFields = ['cv_file_path', 'candidate_status', 'source', 'apply_date', 'evaluation', 'evaluation_comment', 'job_id', 'cover_letter'];

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
            where: withTenantWhere({
                user_id: userId,
                role: 'candidate'
            }),
            include: [
                {
                    model: Candidate,
                    required: false,
                    where: withTenantWhere({}),
                    attributes: ['candidate_info_id', 'cv_file_path', 'candidate_status', 'source', 'apply_date', 'evaluation', 'evaluation_comment', 'cover_letter', 'job_id'],
                    include: [
                        {
                            model: JobDescription,
                            attributes: ['job_id', 'title', 'experience_level', 'employment_type']
                        }
                    ]
                },
                getEmployeeInfoInclude()
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
        const tenantResult = requireTenantId();
        if (!tenantResult.ok) {
            return { status: 400, data: { error: true, message: "Tenant id is required" } };
        }

        const user = await User.findOne({
            where: withTenantWhere({
                user_id: userId,
                role: 'candidate'
            })
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
        const tenantResult = requireTenantId();
        if (!tenantResult.ok) {
            return { status: 400, data: { error: true, message: "Tenant id is required" } };
        }

        const candidates = await User.findAll({
            where: withTenantWhere({
                role: 'candidate',
                is_deleted: true
            }),
            include: [
                {
                    model: Candidate,
                    required: false,
                    where: withTenantWhere({}),
                    attributes: ['candidate_info_id', 'cv_file_path', 'candidate_status', 'source', 'apply_date', 'evaluation', 'evaluation_comment', 'cover_letter', 'job_id'],
                    include: [
                        {
                            model: JobDescription,
                            attributes: ['job_id', 'title', 'experience_level', 'employment_type']
                        }
                    ]
                },
                getEmployeeInfoInclude()
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
        const tenantResult = requireTenantId();
        if (!tenantResult.ok) {
            return { status: 400, data: { error: true, message: "Tenant id is required" } };
        }

        const user = await User.findOne({
            where: withTenantWhere({
                user_id: userId,
                role: 'candidate'
            })
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
        const tenantResult = requireTenantId();
        if (!tenantResult.ok) {
            return { status: 400, data: { error: true, message: "Tenant id is required" } };
        }

        const {
            full_name,
            personal_email,
            candidate_status
        } = query;

        const userWhere = {
            role: 'candidate',
            is_deleted: false
        };

        const candidateWhere = {};

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
            where: withTenantWhere(userWhere),
            include: [
                {
                    model: Candidate,
                    required: false,
                    where: withTenantWhere(candidateWhere),
                    attributes: ['candidate_info_id', 'cv_file_path', 'candidate_status', 'source', 'apply_date', 'evaluation', 'evaluation_comment', 'cover_letter', 'job_id'],
                    include: [
                        {
                            model: JobDescription,
                            attributes: ['job_id', 'title', 'experience_level', 'employment_type']
                        }
                    ]
                },
                getEmployeeInfoInclude()
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
        const tenantResult = requireTenantId();
        if (!tenantResult.ok) {
            return { status: 400, data: { error: true, message: "Tenant id is required" } };
        }

        const {
            full_name,
            personal_email,
            candidate_status
        } = query;

        const userWhere = {
            role: 'candidate',
            is_deleted: true
        };

        const candidateWhere = {};

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
            where: withTenantWhere(userWhere),
            include: [
                {
                    model: Candidate,
                    required: false,
                    where: withTenantWhere(candidateWhere),
                    attributes: ['candidate_info_id', 'cv_file_path', 'candidate_status', 'source', 'apply_date', 'evaluation', 'evaluation_comment', 'cover_letter', 'job_id'],
                    include: [
                        {
                            model: JobDescription,
                            attributes: ['job_id', 'title', 'experience_level', 'employment_type']
                        }
                    ]
                },
                getEmployeeInfoInclude()
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
        const tenantResult = requireTenantId();
        if (!tenantResult.ok) {
            return { status: 400, data: { error: true, message: "Tenant id is required" } };
        }

        const candidateInfo = await Candidate.findOne({
            where: withTenantWhere({
                candidate_info_id: candidateInfoId
            }),
            include: [
                {
                    model: User,
                    attributes: ['user_id', 'full_name', 'personal_email']
                },
                {
                    model: JobDescription,
                    attributes: ['job_id', 'title', 'experience_level', 'employment_type']
                }
            ]
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

        const { interview_time, basic_salary, ...persistedUpdateData } = updateData;

        if (persistedUpdateData.cover_letter && Array.isArray(persistedUpdateData.cover_letter)) {
            persistedUpdateData.cover_letter = persistedUpdateData.cover_letter.join('\n');
        }

        const previousStatus = candidateInfo.candidate_status;
        const nextStatus = persistedUpdateData.candidate_status;

        if (nextStatus === 'interview') {
            if (!interview_time) {
                return {
                    status: 400,
                    data: {
                        error: true,
                        message: 'Vui lòng nhập thời gian phỏng vấn để gửi email hẹn phỏng vấn'
                    }
                };
            }

            const formattedInterviewTime = formatInterviewTime(interview_time);
            if (!formattedInterviewTime) {
                return {
                    status: 400,
                    data: {
                        error: true,
                        message: 'Thời gian phỏng vấn không hợp lệ'
                    }
                };
            }
        }

        if (nextStatus === 'offered') {
            const formattedSalary = formatCurrencyVnd(basic_salary);
            if (!formattedSalary) {
                return {
                    status: 400,
                    data: {
                        error: true,
                        message: 'Vui lòng nhập mức lương cơ bản hợp lệ để gửi email offer'
                    }
                };
            }
        }

        // Cập nhật candidate info
        await candidateInfo.update(persistedUpdateData);

        // Lấy dữ liệu đã cập nhật
        const updatedCandidateInfo = await Candidate.findOne({
            where: withTenantWhere({
                candidate_info_id: candidateInfoId
            }),
            include: [
                {
                    model: JobDescription,
                    attributes: ['job_id', 'title', 'experience_level', 'employment_type']
                },
                {
                    model: User,
                    attributes: ['user_id', 'full_name', 'personal_email']
                }
            ]
        });

        const statusChanged = Boolean(nextStatus) && nextStatus !== previousStatus;
        if (statusChanged) {
            const formattedInterviewTime = nextStatus === 'interview' ? formatInterviewTime(interview_time) : null;
            const formattedSalary = nextStatus === 'offered' ? formatCurrencyVnd(basic_salary) : null;

            try {
                await sendCandidateStatusEmail({
                    personalEmail: updatedCandidateInfo?.User?.personal_email,
                    fullName: updatedCandidateInfo?.User?.full_name,
                    jobTitle: updatedCandidateInfo?.Job_Description?.title,
                    status: nextStatus,
                    interviewTime: formattedInterviewTime,
                    basicSalary: formattedSalary
                });
            } catch (emailError) {
                console.error('Failed to send candidate status update email:', emailError);
            }
        }

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

export const createCompanyEmailService = async (candidateId, companyEmail, password, requestingUser = null) => {
    try {
        const tenantResult = requireTenantId();
        if (!tenantResult.ok) {
            return { status: 400, data: { error: true, message: "Tenant id is required" } };
        }

        const transaction = await User.sequelize.transaction();
        let transactionFinished = false;
        let candidate = null;

        try {
            // Kiểm tra candidate exists
            candidate = await User.findOne({
                where: withTenantWhere({
                    user_id: candidateId,
                    is_deleted: false
                }),
                include: [
                    {
                        model: Candidate,
                        where: withTenantWhere({ candidate_status: 'hired' }),
                        include: [
                            {
                                model: JobDescription,
                                attributes: ['job_id', 'title', 'experience_level', 'employment_type', 'department_id'],
                                include: [
                                    {
                                        model: Department,
                                        as: 'department',
                                        attributes: ['department_id', 'name', 'code'],
                                        required: false
                                    }
                                ]
                            }
                        ]
                    }
                ],
                transaction
            });

            if (!candidate) {
                await transaction.rollback();
                transactionFinished = true;
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
                where: withTenantWhere({
                    company_email: companyEmail,
                    is_deleted: false
                }),
                transaction
            });

            if (existingEmailUser && existingEmailUser.user_id !== Number(candidateId)) {
                await transaction.rollback();
                transactionFinished = true;
                return {
                    status: 400,
                    data: {
                        error: true,
                        message: "Company email already exists"
                    }
                };
            }

            // Nếu đã có company_email khác với email nhập vào thì chặn
            if (candidate.company_email && candidate.company_email !== companyEmail) {
                await transaction.rollback();
                transactionFinished = true;
                return {
                    status: 400,
                    data: {
                        error: true,
                        message: "Candidate already has a company email"
                    }
                };
            }

            const hiredCandidateInfos = candidate.Candidate_Infos || [];
            const hiredJobs = hiredCandidateInfos
                .map((info) => info?.Job_Description)
                .filter(Boolean);

            const targetRole = hiredJobs.some((job) => isHrDepartment(job.department))
                ? 'hr'
                : 'employee';

            const hiredCandidateInfo = hiredCandidateInfos.find((info) => info?.Job_Description) || null;
            const hiredJob = hiredCandidateInfo?.Job_Description;

            // Chỉ cập nhật thông tin đăng nhập khi candidate chưa có company_email
            if (!candidate.company_email) {
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(password, saltRounds);

                await candidate.update({
                    company_email: companyEmail,
                    password: hashedPassword,
                    role: targetRole
                }, { transaction });
            } else if (candidate.role !== targetRole) {
                await candidate.update({ role: targetRole }, { transaction });
            }

            // Đảm bảo có bản ghi Employee_Info tương ứng (idempotent)
            const existingEmployeeInfo = await Employee.findOne({
                where: withTenantWhere({ user_id: candidate.user_id }),
                transaction
            });

            if (!existingEmployeeInfo) {
                const resolvedPosition = resolveEmployeePositionFromJob(hiredJob);

                await Employee.create({
                    user_id: candidate.user_id,
                    hire_date: new Date(),
                    position: resolvedPosition,
                    department_id: hiredJob?.department_id || null,
                    tenant_id: candidate.tenant_id
                }, { transaction });
            } else {
                const resolvedPosition = resolveEmployeePositionFromJob(hiredJob);
                const resolvedDepartmentId = hiredJob?.department_id || null;

                const employeeUpdateData = {};

                if (existingEmployeeInfo.position !== resolvedPosition) {
                    employeeUpdateData.position = resolvedPosition;
                }

                if (!existingEmployeeInfo.department_id && resolvedDepartmentId) {
                    employeeUpdateData.department_id = resolvedDepartmentId;
                }

                if (Object.keys(employeeUpdateData).length > 0) {
                    await existingEmployeeInfo.update(employeeUpdateData, { transaction });
                }
            }


            await transaction.commit();
            transactionFinished = true;
        } catch (txError) {
            if (!transactionFinished && transaction.finished !== 'rollback' && transaction.finished !== 'commit') {
                await transaction.rollback();
            }
            throw txError;
        }

        // Lấy dữ liệu đã cập nhật sau khi transaction đã kết thúc
        const updatedCandidate = await User.findOne({
            where: withTenantWhere({ user_id: candidateId }),
            attributes: { exclude: ['password'] }, // Không trả về password
            include: [
                {
                    model: Candidate,
                    where: withTenantWhere({ candidate_status: 'hired' }),
                    include: [
                        {
                            model: JobDescription,
                            attributes: ['job_id', 'title', 'experience_level', 'employment_type', 'department_id']
                        }
                    ]
                },
                {
                    model: Employee,
                    as: 'Employee_Info'
                },
                {
                    model: Tenant,
                    as: 'tenant',
                    attributes: ['tenant_id', 'tenant_code']
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