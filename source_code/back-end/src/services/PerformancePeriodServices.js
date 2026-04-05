import '../models/associations.js';
import { Op } from 'sequelize';
import PerformancePeriod from '../models/PerformancePeriod.js';
import Performance from '../models/Performance.js';
import Department from '../models/Department.js';
import Team from '../models/Team.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { createNotificationsForUsers } from './NotificationServices.js';
import { getEvaluationTargetUserIds, resolveHierarchyRole } from './HierarchyServices.js';

const PERFORMANCE_NOTIFICATION_TYPES = {
    periodCreated: 'performance_period_created',
    deadlineReminder: 'performance_review_reminder',
    fallback: 'task_updated'
};

const PERFORMANCE_NOTIFICATION_TITLES = {
    periodCreated: 'Kỳ đánh giá mới',
    deadlineReminder: 'Nhắc nhở hoàn tất đánh giá'
};

const parsePositiveInt = (value, fallback) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const getReminderConfig = () => ({
    daysBeforeDeadline: parsePositiveInt(process.env.PERFORMANCE_REMINDER_DAYS_BEFORE_DEADLINE, 3),
    lookbackHours: parsePositiveInt(process.env.PERFORMANCE_REMINDER_LOOKBACK_HOURS, 24),
    intervalMs: parsePositiveInt(process.env.PERFORMANCE_REMINDER_INTERVAL_MS, 6 * 60 * 60 * 1000),
    initialDelayMs: parsePositiveInt(process.env.PERFORMANCE_REMINDER_INITIAL_DELAY_MS, 30 * 1000)
});

let performanceReminderTimer = null;
let performanceReminderBootTimer = null;

const toDateOnlyLocal = (value) => {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return null;

    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatDateForMessage = (value) => {
    const normalized = toDateOnlyLocal(value);
    return normalized || String(value || '');
};

const getActiveReviewLeads = async () => {
    const [departments, teams] = await Promise.all([
        Department.findAll({
            where: {
                active: true,
                manager_id: { [Op.ne]: null }
            },
            attributes: ['manager_id']
        }),
        Team.findAll({
            where: {
                active: true,
                leader_id: { [Op.ne]: null }
            },
            attributes: ['leader_id']
        })
    ]);

    const userIds = [
        ...new Set([
            ...departments.map((department) => Number(department.manager_id)).filter((id) => Number.isInteger(id) && id > 0),
            ...teams.map((team) => Number(team.leader_id)).filter((id) => Number.isInteger(id) && id > 0)
        ])
    ];

    if (userIds.length === 0) return [];

    return User.findAll({
        where: {
            user_id: { [Op.in]: userIds },
            is_deleted: false,
            status: 'active'
        },
        attributes: ['user_id', 'role', 'full_name']
    });
};

const createPerformanceNotificationsWithFallback = async ({
    recipientIds,
    actorId,
    preferredType,
    title,
    message,
    period,
    metadata = null
}) => {
    const payload = {
        recipientIds,
        actorId,
        title,
        message,
        entityType: 'performance_period',
        entityId: Number(period?.period_id) || null,
        metadata
    };

    try {
        return await createNotificationsForUsers({
            ...payload,
            type: preferredType
        });
    } catch (error) {
        console.error('Performance notification type fallback triggered:', error);
        return createNotificationsForUsers({
            ...payload,
            type: PERFORMANCE_NOTIFICATION_TYPES.fallback
        });
    }
};

const notifyReviewLeadsForNewPeriod = async ({ period, actorId }) => {
    if (period?.status !== 'in_progress') return 0;

    const reviewers = await getActiveReviewLeads();
    if (reviewers.length === 0) return 0;

    const reviewerIds = reviewers.map((reviewer) => reviewer.user_id);
    const startDate = formatDateForMessage(period.start_date);
    const endDate = formatDateForMessage(period.end_date);

    const notifications = await createPerformanceNotificationsWithFallback({
        recipientIds: reviewerIds,
        actorId,
        preferredType: PERFORMANCE_NOTIFICATION_TYPES.periodCreated,
        title: PERFORMANCE_NOTIFICATION_TITLES.periodCreated,
        message: `Kỳ đánh giá "${period.period_name}" (${startDate} - ${endDate}) đã được tạo. Vui lòng thực hiện đánh giá nhân sự thuộc phạm vi quản lý trước hạn ${endDate}.`,
        period,
        metadata: {
            period_id: period.period_id,
            period_name: period.period_name,
            start_date: period.start_date,
            end_date: period.end_date,
            status: period.status,
            trigger: 'period_created'
        }
    });

    return notifications.length;
};

const hasInitialPeriodNotificationSent = async (periodId) => {
    const sentCount = await Notification.count({
        where: {
            entity_type: 'performance_period',
            entity_id: Number(periodId),
            title: PERFORMANCE_NOTIFICATION_TITLES.periodCreated,
            type: {
                [Op.in]: [
                    PERFORMANCE_NOTIFICATION_TYPES.periodCreated,
                    PERFORMANCE_NOTIFICATION_TYPES.fallback
                ]
            }
        }
    });

    return sentCount > 0;
};

const notifyReviewLeadsWhenPeriodInProgress = async ({ period, actorId }) => {
    if (!period || period.status !== 'in_progress') return 0;

    const alreadySent = await hasInitialPeriodNotificationSent(period.period_id);
    if (alreadySent) return 0;

    return notifyReviewLeadsForNewPeriod({ period, actorId });
};

const hasRecentReminder = async ({ reviewerId, periodId, lookbackHours }) => {
    const windowStart = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);
    const sentCount = await Notification.count({
        where: {
            user_id: reviewerId,
            entity_type: 'performance_period',
            entity_id: periodId,
            title: PERFORMANCE_NOTIFICATION_TITLES.deadlineReminder,
            type: {
                [Op.in]: [
                    PERFORMANCE_NOTIFICATION_TYPES.deadlineReminder,
                    PERFORMANCE_NOTIFICATION_TYPES.fallback
                ]
            },
            created_at: { [Op.gte]: windowStart }
        }
    });

    return sentCount > 0;
};

const getPendingReviewCountForReviewer = async ({ reviewer, periodId }) => {
    const targetUserIds = await getEvaluationTargetUserIds({
        user_id: reviewer.user_id,
        role: reviewer.role
    });

    if (targetUserIds.length === 0) {
        return { totalTargets: 0, pendingCount: 0, completedCount: 0 };
    }

    const completedCount = await Performance.count({
        where: {
            period_id: periodId,
            reviewer_id: reviewer.user_id,
            user_id: { [Op.in]: targetUserIds }
        },
        distinct: true,
        col: 'user_id'
    });

    const pendingCount = Math.max(targetUserIds.length - completedCount, 0);

    return {
        totalTargets: targetUserIds.length,
        completedCount,
        pendingCount
    };
};

export const sendPerformanceReviewDeadlineReminders = async (customConfig = {}) => {
    const config = {
        ...getReminderConfig(),
        ...customConfig
    };

    const today = new Date();
    const todayDate = toDateOnlyLocal(today);
    if (!todayDate) return { periods: 0, notifications_sent: 0 };

    const reminderDeadline = new Date(today);
    reminderDeadline.setDate(reminderDeadline.getDate() + config.daysBeforeDeadline);
    const reminderDeadlineDate = toDateOnlyLocal(reminderDeadline);

    if (!reminderDeadlineDate) return { periods: 0, notifications_sent: 0 };

    const periods = await PerformancePeriod.findAll({
        where: {
            status: 'in_progress',
            end_date: {
                [Op.gte]: todayDate,
                [Op.lte]: reminderDeadlineDate
            }
        },
        order: [['end_date', 'ASC']],
        attributes: ['period_id', 'period_name', 'start_date', 'end_date', 'status']
    });

    if (periods.length === 0) {
        return { periods: 0, notifications_sent: 0 };
    }

    const reviewers = await getActiveReviewLeads();
    if (reviewers.length === 0) {
        return { periods: periods.length, notifications_sent: 0 };
    }

    let notificationsSent = 0;

    for (const period of periods) {
        const endDate = formatDateForMessage(period.end_date);

        for (const reviewer of reviewers) {
            const isAlreadyReminded = await hasRecentReminder({
                reviewerId: reviewer.user_id,
                periodId: period.period_id,
                lookbackHours: config.lookbackHours
            });

            if (isAlreadyReminded) continue;

            const { totalTargets, pendingCount, completedCount } = await getPendingReviewCountForReviewer({
                reviewer,
                periodId: period.period_id
            });

            if (totalTargets === 0 || pendingCount === 0) continue;

            const reminderNotifications = await createPerformanceNotificationsWithFallback({
                recipientIds: [reviewer.user_id],
                actorId: null,
                preferredType: PERFORMANCE_NOTIFICATION_TYPES.deadlineReminder,
                title: PERFORMANCE_NOTIFICATION_TITLES.deadlineReminder,
                message: `Kỳ đánh giá "${period.period_name}" sẽ hết hạn vào ${endDate}. Bạn còn ${pendingCount}/${totalTargets} nhân sự chưa được đánh giá. Vui lòng hoàn tất trước thời hạn.`,
                period,
                metadata: {
                    period_id: period.period_id,
                    period_name: period.period_name,
                    end_date: period.end_date,
                    pending_count: pendingCount,
                    completed_count: completedCount,
                    total_targets: totalTargets,
                    trigger: 'deadline_reminder'
                }
            });

            notificationsSent += reminderNotifications.length;
        }
    }

    return {
        periods: periods.length,
        notifications_sent: notificationsSent
    };
};

export const startPerformanceReminderScheduler = () => {
    const schedulerEnabled = process.env.ENABLE_PERFORMANCE_REMINDER_SCHEDULER !== 'false';

    if (!schedulerEnabled) {
        console.log('Performance reminder scheduler is disabled via env.');
        return;
    }

    if (performanceReminderTimer) {
        return;
    }

    const config = getReminderConfig();

    const runSafely = async () => {
        try {
            const result = await sendPerformanceReviewDeadlineReminders(config);
            if (result.notifications_sent > 0) {
                console.log(`Performance reminder scheduler sent ${result.notifications_sent} notifications across ${result.periods} periods.`);
            }
        } catch (error) {
            console.error('Performance reminder scheduler failed:', error);
        }
    };

    performanceReminderBootTimer = setTimeout(() => {
        void runSafely();
    }, config.initialDelayMs);

    performanceReminderTimer = setInterval(() => {
        void runSafely();
    }, config.intervalMs);

    console.log(`Performance reminder scheduler started with ${config.intervalMs}ms interval.`);
};

const canManagePerformancePeriod = async (requestingUser) => {
    if (!requestingUser) return false;
    if (requestingUser.role === 'hr') return true;
    if (requestingUser.role !== 'manager') return false;

    const hierarchyRole = await resolveHierarchyRole({
        userId: requestingUser.user_id,
        role: requestingUser.role
    });

    return hierarchyRole === 'manager';
};

export const createPeriodService = async (data, requestingUser) => {
    try {
        const canManage = await canManagePerformancePeriod(requestingUser);
        if (!canManage) {
            return { status: 403, data: { error: true, message: 'Only HR or senior manager can create performance periods' } };
        }

        const { period_name, start_date, end_date, status = 'planned', description } = data;
        if (!period_name) return { status: 400, data: { error: true, message: "Period name is required" } };
        if (!start_date || !end_date) return { status: 400, data: { error: true, message: "Start date and end date are required" } };

        const period = await PerformancePeriod.create({ period_name, start_date, end_date, status, description });

        try {
            await notifyReviewLeadsWhenPeriodInProgress({
                period,
                actorId: requestingUser?.user_id || null
            });
        } catch (notificationError) {
            console.error('Failed to send new performance period notifications:', notificationError);
        }

        return { status: 201, data: { error: false, message: "Performance period created successfully", period } };
    } catch (error) {
        console.error('Error in createPeriodService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const getAllPeriodsService = async () => {
    try {
        const periods = await PerformancePeriod.findAll({ order: [['start_date', 'DESC']] });
        return { status: 200, data: { error: false, message: "Performance periods retrieved successfully", periods } };
    } catch (error) {
        console.error('Error in getAllPeriodsService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const getPeriodByIdService = async (id) => {
    try {
        const period = await PerformancePeriod.findByPk(id, {
            include: [{ model: Performance, as: 'performances', attributes: ['perf_id', 'user_id', 'rating', 'review_date'] }]
        });
        if (!period) return { status: 404, data: { error: true, message: "Period not found" } };
        return { status: 200, data: { error: false, message: "Period retrieved successfully", period } };
    } catch (error) {
        console.error('Error in getPeriodByIdService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const updatePeriodService = async (id, data, requestingUser) => {
    try {
        const canManage = await canManagePerformancePeriod(requestingUser);
        if (!canManage) {
            return { status: 403, data: { error: true, message: 'Only HR or senior manager can update performance periods' } };
        }

        const period = await PerformancePeriod.findByPk(id);
        if (!period) return { status: 404, data: { error: true, message: "Period not found" } };

        const allowed = ['period_name', 'start_date', 'end_date', 'status', 'description'];
        const updateData = {};
        Object.keys(data).forEach(key => { if (allowed.includes(key)) updateData[key] = data[key]; });

        const previousStatus = period.status;
        await period.update(updateData);

        try {
            const transitionedToInProgress = previousStatus !== 'in_progress' && period.status === 'in_progress';
            if (transitionedToInProgress) {
                await notifyReviewLeadsWhenPeriodInProgress({
                    period,
                    actorId: requestingUser?.user_id || null
                });
            }
        } catch (notificationError) {
            console.error('Failed to send in-progress performance period notifications on update:', notificationError);
        }

        return { status: 200, data: { error: false, message: "Period updated successfully" } };
    } catch (error) {
        console.error('Error in updatePeriodService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const togglePeriodStatusService = async (id, requestingUser) => {
    try {
        const canManage = await canManagePerformancePeriod(requestingUser);
        if (!canManage) {
            return { status: 403, data: { error: true, message: 'Only HR or senior manager can change period status' } };
        }

        const period = await PerformancePeriod.findByPk(id);
        if (!period) return { status: 404, data: { error: true, message: "Period not found" } };

        const previousStatus = period.status;
        const transitions = { planned: 'in_progress', in_progress: 'completed', completed: 'completed' };
        const newStatus = transitions[period.status];
        await period.update({ status: newStatus });

        try {
            const transitionedToInProgress = previousStatus !== 'in_progress' && newStatus === 'in_progress';
            if (transitionedToInProgress) {
                await notifyReviewLeadsWhenPeriodInProgress({
                    period,
                    actorId: requestingUser?.user_id || null
                });
            }
        } catch (notificationError) {
            console.error('Failed to send in-progress performance period notifications on status toggle:', notificationError);
        }

        return { status: 200, data: { error: false, message: `Period status changed to ${newStatus}`, period } };
    } catch (error) {
        console.error('Error in togglePeriodStatusService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};
