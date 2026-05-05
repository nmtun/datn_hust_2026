import '../models/associations.js';
import { Op } from 'sequelize';
import Compensation from '../models/Compensation.js';
import Performance from '../models/Performance.js';
import PerformancePeriod from '../models/PerformancePeriod.js';
import User from '../models/User.js';
import { createNotificationsForUsers } from './NotificationServices.js';

const userAttrs = ['user_id', 'full_name', 'company_email'];
const COMPENSATION_NOTIFICATION_TYPE = 'compensation_recommendation';
const COMPENSATION_NOTIFICATION_TITLE = 'Đề xuất lương thưởng';

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

const safeString = (value) => {
    if (value == null) return "";
    return String(value).trim();
};

const clipText = (value, limit = 50000) => {
    const text = safeString(value);
    if (!text) return "";
    return text.length > limit ? `${text.slice(0, limit)}...` : text;
};

const parseJsonFromContent = (content) => {
    if (!content) return null;
    let normalized = content.trim();

    if (normalized.startsWith("```")) {
        normalized = normalized.replace(/```[a-zA-Z]*\n?/g, "").replace(/```/g, "").trim();
    }

    const firstBrace = normalized.indexOf("{");
    const lastBrace = normalized.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace >= 0) {
        normalized = normalized.slice(firstBrace, lastBrace + 1);
    }

    return JSON.parse(normalized);
};

const requestOpenAiJson = async (prompt) => {
    const apiKey = (process.env.OPENAI_API_KEY || "").trim();
    if (!apiKey) {
        throw new Error("OPENAI_API_KEY is missing");
    }

    if (typeof fetch !== "function") {
        throw new Error("Global fetch is not available. Use Node.js 18+.");
    }

    const model = (process.env.OPENAI_MODEL_NAME || DEFAULT_OPENAI_MODEL).trim();

    const response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model,
            temperature: 0.3,
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: prompt.system },
                { role: "user", content: prompt.user }
            ]
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
        throw new Error("OpenAI response is empty");
    }

    return parseJsonFromContent(content);
};

const normalizeYear = (value) => {
    const currentYear = new Date().getFullYear();
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed >= 2000 && parsed <= currentYear + 1) {
        return parsed;
    }
    return currentYear;
};

const getRatingRule = (averageRating) => {
    if (averageRating >= 4.5) return { label: 'xuất sắc', percent: 15, bonusMonths: 2 };
    if (averageRating >= 3.5) return { label: 'tốt', percent: 10, bonusMonths: 1.5 };
    if (averageRating >= 2.5) return { label: 'trung bình', percent: 5, bonusMonths: 1 };
    return { label: 'kém', percent: 0, bonusMonths: 0 };
};

const roundMoney = (value) => {
    if (!Number.isFinite(value)) return null;
    return Math.round(value * 100) / 100;
};

const buildPerformanceCommentPrompt = ({ employeeName, year, averageRating, reviews }) => {
    const reviewLines = reviews.map((review, index) => {
        const periodName = safeString(review.period?.period_name) || `Đánh giá ${index + 1}`;
        const reviewDate = safeString(review.review_date) || "";

        return [
            `${periodName}${reviewDate ? ` (${reviewDate})` : ""}`,
            `KPI: ${clipText(review.kpi_goals, 50000) || "Không có"}`,
            `Kết quả: ${clipText(review.achievement, 50000) || "Không có"}`,
            `Nhận xét: ${clipText(review.feedback, 50000) || "Không có"}`,
            `Điểm: ${review.rating ?? "Không có"}`
        ].join(" | ");
    });

    return {
        system: [
            "Ban la chuyen gia nhan su ho tro de xuat luong/thuong.",
            "Hay viet nhan xet ngan gon, cu the, dua tren du lieu danh gia duoc cung cap.",
            "Khong duoc tu suy dien, khong noi chung chung.",
            "Tra ve JSON hop le theo schema: {\"comment\": \"...\"}."
        ].join("\n"),
        user: [
            `Nhan su: ${employeeName}`,
            `Nam danh gia: ${year}`,
            `Diem trung binh: ${averageRating.toFixed(2)}`,
            "Du lieu danh gia:",
            reviewLines.join("\n"),
            "Yeu cau: Tra ve 1-3 cau nhan xet bang tieng Viet, tap trung vao KPI, ket qua va nhan xet quan ly."
        ].join("\n")
    };
};

const buildFallbackComment = ({ averageRating, ratingCount }) => {
    if (!ratingCount) {
        return "Chưa có dữ liệu đánh giá trong năm được chọn.";
    }

    if (averageRating >= 4.5) {
        return "Hiệu suất xuất sắc, vượt trội so với mục tiêu KPI và duy trì chất lượng công việc ở mức cao nhất.";
    }
    if (averageRating >= 3.5) {
        return "Hiệu suất tốt, đáp ứng và đôi khi vượt mục tiêu KPI, với kết quả công việc ổn định và đáng tin cậy.";
    }
    if (averageRating >= 2.5) {
        return "Hiệu suất trung bình, cần cải thiện ổn định về KPI và kết quả.";
    }
    return "Hiệu suất kém, cần kế hoạch cải thiện rõ ràng và hỗ trợ sát sao.";
};

const buildRecommendationReason = ({ year }) => {
    return `Kỳ đánh giá lương&thưởng năm ${year}`;
};

export const createCompensationService = async (data, approverId) => {
    try {
        const { user_id, salary, bonus, effective_date, reason, comment } = data;
        if (!user_id || !effective_date) {
            return { status: 400, data: { error: true, message: "user_id and effective_date are required" } };
        }

        const hasSalary = salary !== undefined && salary !== null;
        const hasBonus = bonus !== undefined && bonus !== null;

        if (!hasSalary && !hasBonus) {
            return { status: 400, data: { error: true, message: "salary or bonus is required" } };
        }

        let finalSalary = salary;
        if (!hasSalary) {
            const latestRecord = await Compensation.findOne({
                where: { user_id },
                order: [['effective_date', 'DESC']]
            });

            if (!latestRecord) {
                return { status: 400, data: { error: true, message: "salary is required for the first record" } };
            }

            finalSalary = latestRecord.salary;
        }

        const comp = await Compensation.create({
            user_id,
            salary: finalSalary,
            bonus: hasBonus ? bonus : 0,
            effective_date,
            reason,
            comment,
            evaluated_by: approverId,
            approved_by: approverId, approved_at: new Date(), created_at: new Date()
        });
        return { status: 201, data: { error: false, message: "Compensation record created successfully", compensation: comp } };
    } catch (error) {
        console.error('Error in createCompensationService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const getAllCompensationService = async () => {
    try {
        const records = await Compensation.findAll({
            include: [
                {
                    model: User,
                    as: 'employee',
                    attributes: userAttrs,
                    where: { role: { [Op.ne]: 'manager' } }
                },
                { model: User, as: 'approver', attributes: userAttrs }
            ],
            order: [['effective_date', 'DESC']]
        });
        return { status: 200, data: { error: false, message: "All compensation records retrieved", records } };
    } catch (error) {
        console.error('Error in getAllCompensationService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const getCompensationByEmployeeService = async (userId) => {
    try {
        const records = await Compensation.findAll({
            where: { user_id: userId },
            include: [{ model: User, as: 'approver', attributes: userAttrs }],
            order: [['effective_date', 'DESC']]
        });
        return { status: 200, data: { error: false, message: "Employee compensation history retrieved", records } };
    } catch (error) {
        console.error('Error in getCompensationByEmployeeService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const updateCompensationService = async (id, data) => {
    try {
        const comp = await Compensation.findByPk(id);
        if (!comp) return { status: 404, data: { error: true, message: "Compensation record not found" } };

        const allowed = ['salary', 'bonus', 'effective_date', 'reason', 'comment'];
        const updateData = {};
        Object.keys(data).forEach(key => { if (allowed.includes(key)) updateData[key] = data[key]; });
        updateData.updated_at = new Date();

        await comp.update(updateData);
        return { status: 200, data: { error: false, message: "Compensation updated successfully" } };
    } catch (error) {
        console.error('Error in updateCompensationService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const getMyCompensationService = async (userId) => {
    try {
        const records = await Compensation.findAll({
            where: { user_id: userId },
            include: [{ model: User, as: 'approver', attributes: userAttrs }],
            order: [['effective_date', 'DESC']]
        });
        return { status: 200, data: { error: false, message: "My compensation history retrieved", records } };
    } catch (error) {
        console.error('Error in getMyCompensationService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const getCompensationRecommendationsService = async ({ year, requestingUser }) => {
    try {
        const targetYear = normalizeYear(year);
        const startDate = `${targetYear}-01-01`;
        const endDate = `${targetYear}-12-31`;

        const employees = await User.findAll({
            where: {
                role: { [Op.in]: ['employee', 'hr'] },
                is_deleted: false,
                status: 'active',
                user_id: { [Op.ne]: requestingUser?.user_id }
            },
            attributes: userAttrs
        });

        const employeeIds = employees.map((employee) => employee.user_id);
        if (employeeIds.length === 0) {
            return {
                status: 200,
                data: { error: false, message: "No employees found", year: targetYear, recommendations: [] }
            };
        }

        const performanceRecords = await Performance.findAll({
            where: {
                user_id: { [Op.in]: employeeIds },
                review_date: { [Op.gte]: startDate, [Op.lte]: endDate }
            },
            include: [
                {
                    model: PerformancePeriod,
                    as: 'period',
                    attributes: ['period_name', 'start_date', 'end_date'],
                    where: { status: 'completed' },
                    required: true
                }
            ],
            order: [['review_date', 'DESC']]
        });

        const performanceByUser = new Map();
        for (const record of performanceRecords) {
            const list = performanceByUser.get(record.user_id) || [];
            list.push(record);
            performanceByUser.set(record.user_id, list);
        }

        const compensationRecords = await Compensation.findAll({
            where: { user_id: { [Op.in]: employeeIds } },
            order: [['effective_date', 'DESC'], ['comp_id', 'DESC']]
        });

        const latestCompensationByUser = new Map();
        for (const record of compensationRecords) {
            if (!latestCompensationByUser.has(record.user_id)) {
                latestCompensationByUser.set(record.user_id, record);
            }
        }

        const recommendations = [];
        const openAiEnabled = Boolean((process.env.OPENAI_API_KEY || "").trim());

        for (const employee of employees) {
            const reviews = performanceByUser.get(employee.user_id) || [];
            const ratingValues = reviews
                .map((review) => Number(review.rating))
                .filter((rating) => Number.isFinite(rating));
            const ratingCount = ratingValues.length;
            const averageRating = ratingCount
                ? ratingValues.reduce((sum, value) => sum + value, 0) / ratingCount
                : 0;
            const averageRounded = Math.round(averageRating * 100) / 100;

            const latestComp = latestCompensationByUser.get(employee.user_id);
            const currentSalaryRaw = latestComp?.salary != null ? Number(latestComp.salary) : null;
            const currentSalary = Number.isFinite(currentSalaryRaw) ? currentSalaryRaw : null;

            const rule = getRatingRule(averageRounded);
            const increaseAmount = currentSalary != null
                ? roundMoney(currentSalary * (rule.percent / 100))
                : null;
            const recommendedSalary = currentSalary != null
                ? roundMoney(currentSalary + (increaseAmount || 0))
                : null;
            const recommendedBonus = currentSalary != null
                ? roundMoney(currentSalary * rule.bonusMonths)
                : null;

            let aiComment = "";
            if (openAiEnabled && reviews.length > 0) {
                try {
                    const prompt = buildPerformanceCommentPrompt({
                        employeeName: employee.full_name,
                        year: targetYear,
                        averageRating: averageRounded,
                        reviews
                    });
                    const aiResult = await requestOpenAiJson(prompt);
                    aiComment = safeString(aiResult?.comment);
                } catch (error) {
                    console.error('OpenAI comment generation failed:', error.message);
                }
            }

            if (!aiComment) {
                aiComment = buildFallbackComment({ averageRating: averageRounded, ratingCount });
            }

            recommendations.push({
                user_id: employee.user_id,
                full_name: employee.full_name,
                company_email: employee.company_email,
                average_rating: averageRounded,
                rating_count: ratingCount,
                current_salary: currentSalary,
                salary_increase_percent: rule.percent,
                bonus_months: rule.bonusMonths,
                recommended_salary: recommendedSalary,
                recommended_bonus: recommendedBonus,
                ai_comment: aiComment
            });
        }

        return {
            status: 200,
            data: {
                error: false,
                message: "Compensation recommendations generated",
                year: targetYear,
                recommendations
            }
        };
    } catch (error) {
        console.error('Error in getCompensationRecommendationsService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const saveCompensationRecommendationsService = async ({ year, recommendations, requestingUser }) => {
    try {
        const targetYear = normalizeYear(year);
        if (!Array.isArray(recommendations) || recommendations.length === 0) {
            return { status: 400, data: { error: true, message: "Recommendations are required" } };
        }

        const employeeIds = recommendations
            .map((item) => Number(item?.user_id))
            .filter((id) => Number.isInteger(id) && id > 0 && id !== requestingUser?.user_id);

        if (employeeIds.length === 0) {
            return { status: 400, data: { error: true, message: "No valid employees to save" } };
        }

        const employees = await User.findAll({
            where: {
                user_id: { [Op.in]: employeeIds },
                role: { [Op.ne]: 'manager' },
                is_deleted: false
            },
            attributes: userAttrs
        });
        const employeesById = new Map(employees.map((employee) => [employee.user_id, employee]));

        const now = new Date();
        const effectiveDate = now.toISOString().slice(0, 10);

        const summary = {
            created: 0,
            skipped: 0,
            failed: 0,
            notifications_sent: 0
        };

        for (const item of recommendations) {
            const userId = Number(item?.user_id);
            const employee = employeesById.get(userId);
            if (!employee) {
                summary.skipped += 1;
                continue;
            }

            const salaryValue = Number(item?.recommended_salary);
            if (!Number.isFinite(salaryValue)) {
                summary.skipped += 1;
                continue;
            }

            const bonusValue = Number(item?.recommended_bonus ?? 0);
            const aiComment = safeString(item?.ai_comment);
            const managerComment = safeString(item?.comment);
            const finalComment = managerComment || aiComment;
            const reason = buildRecommendationReason({
                year: targetYear,
                recommendedSalary: salaryValue,
                recommendedBonus: bonusValue
            });

            try {
                const created = await Compensation.create({
                    user_id: userId,
                    salary: roundMoney(salaryValue),
                    bonus: roundMoney(Number.isFinite(bonusValue) ? bonusValue : 0),
                    effective_date: effectiveDate,
                    reason,
                    comment: finalComment || null,
                    evaluated_by: requestingUser?.user_id ?? null,
                    approved_by: requestingUser?.user_id,
                    approved_at: now,
                    created_at: now,
                    updated_at: null
                });

                summary.created += 1;

                try {
                    const notifications = await createNotificationsForUsers({
                        recipientIds: [userId],
                        actorId: requestingUser?.user_id ?? null,
                        type: COMPENSATION_NOTIFICATION_TYPE,
                        title: COMPENSATION_NOTIFICATION_TITLE,
                        message: `Đề xuất lương/thưởng năm ${targetYear} đã được cập nhật. Vui lòng xem chi tiết trong mục lương thưởng.`,
                        entityType: 'compensation',
                        entityId: created?.comp_id ?? null,
                        metadata: {
                            year: targetYear,
                            recommended_salary: roundMoney(salaryValue),
                            recommended_bonus: roundMoney(Number.isFinite(bonusValue) ? bonusValue : 0)
                        }
                    });
                    summary.notifications_sent += notifications.length;
                } catch (notifyError) {
                    console.error('Failed to send compensation notification:', notifyError);
                }
            } catch (error) {
                console.error('Failed to save compensation recommendation:', error);
                summary.failed += 1;
            }
        }

        return {
            status: 200,
            data: {
                error: false,
                message: "Compensation recommendations saved",
                year: targetYear,
                summary
            }
        };
    } catch (error) {
        console.error('Error in saveCompensationRecommendationsService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};
