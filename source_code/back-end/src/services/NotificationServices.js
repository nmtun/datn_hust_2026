import { Op } from 'sequelize';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { emitToUser } from '../utils/socket.js';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const normalizeUserId = (context) => {
    if (context == null) return null;
    const raw = context.user_id ?? context.userId ?? context;
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? null : parsed;
};

const parseLimit = (value) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed <= 0) return DEFAULT_LIMIT;
    return Math.min(parsed, MAX_LIMIT);
};

const parseOffset = (value) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed < 0) return 0;
    return parsed;
};

const toBoolean = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value !== 'string') return false;
    return ['1', 'true', 'yes'].includes(value.toLowerCase());
};

const notificationInclude = [
    { model: User, as: 'actor', attributes: ['user_id', 'full_name', 'company_email'], required: false }
];

export const createNotificationsForUsers = async ({
    recipientIds = [],
    actorId = null,
    type,
    title,
    message,
    entityType = null,
    entityId = null,
    metadata = null
}) => {
    if (!type || !title || !message) return [];

    const uniqueRecipientIds = [
        ...new Set(recipientIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0))
    ];

    if (uniqueRecipientIds.length === 0) return [];

    const now = new Date();
    const payload = uniqueRecipientIds.map((recipientId) => ({
        user_id: recipientId,
        actor_id: actorId ? Number(actorId) : null,
        type,
        title,
        message,
        entity_type: entityType,
        entity_id: entityId ? Number(entityId) : null,
        metadata,
        is_read: false,
        created_at: now,
        updated_at: now
    }));

    const createdNotifications = await Notification.bulkCreate(payload);
    const createdIds = createdNotifications.map((item) => item.notification_id);

    const notifications = await Notification.findAll({
        where: {
            notification_id: { [Op.in]: createdIds }
        },
        include: notificationInclude,
        order: [['created_at', 'DESC']]
    });

    notifications.forEach((notification) => {
        emitToUser(notification.user_id, 'notification:new', { notification });
    });

    return notifications;
};

export const getNotificationsService = async (query = {}, requestingUser) => {
    try {
        const userId = normalizeUserId(requestingUser);
        if (!userId) {
            return { status: 401, data: { error: true, message: 'Invalid requester context' } };
        }

        const limit = parseLimit(query.limit);
        const offset = parseOffset(query.offset);
        const unreadOnly = toBoolean(query.unread_only);

        const where = { user_id: userId };
        if (unreadOnly) {
            where.is_read = false;
        }

        const { rows: notifications, count: total } = await Notification.findAndCountAll({
            where,
            include: notificationInclude,
            order: [['is_read', 'ASC'], ['created_at', 'DESC']],
            limit,
            offset
        });

        const unreadCount = await Notification.count({ where: { user_id: userId, is_read: false } });

        return {
            status: 200,
            data: {
                error: false,
                message: 'Notifications retrieved successfully',
                notifications,
                total,
                unread_count: unreadCount,
                limit,
                offset
            }
        };
    } catch (error) {
        console.error('Error in getNotificationsService:', error);
        return { status: 500, data: { error: true, message: 'Internal server error', details: error.message } };
    }
};

export const getUnreadCountService = async (requestingUser) => {
    try {
        const userId = normalizeUserId(requestingUser);
        if (!userId) {
            return { status: 401, data: { error: true, message: 'Invalid requester context' } };
        }

        const unreadCount = await Notification.count({
            where: {
                user_id: userId,
                is_read: false
            }
        });

        return {
            status: 200,
            data: {
                error: false,
                message: 'Unread count retrieved successfully',
                unread_count: unreadCount
            }
        };
    } catch (error) {
        console.error('Error in getUnreadCountService:', error);
        return { status: 500, data: { error: true, message: 'Internal server error', details: error.message } };
    }
};

export const markNotificationAsReadService = async (notificationId, requestingUser) => {
    try {
        const userId = normalizeUserId(requestingUser);
        if (!userId) {
            return { status: 401, data: { error: true, message: 'Invalid requester context' } };
        }

        const notification = await Notification.findOne({
            where: {
                notification_id: Number(notificationId),
                user_id: userId
            }
        });

        if (!notification) {
            return { status: 404, data: { error: true, message: 'Notification not found' } };
        }

        if (!notification.is_read) {
            const now = new Date();
            await notification.update({
                is_read: true,
                read_at: now,
                updated_at: now
            });

            emitToUser(userId, 'notification:updated', {
                notification_id: notification.notification_id,
                is_read: true,
                read_at: now
            });
        }

        return {
            status: 200,
            data: {
                error: false,
                message: 'Notification marked as read successfully'
            }
        };
    } catch (error) {
        console.error('Error in markNotificationAsReadService:', error);
        return { status: 500, data: { error: true, message: 'Internal server error', details: error.message } };
    }
};

export const markAllNotificationsAsReadService = async (requestingUser) => {
    try {
        const userId = normalizeUserId(requestingUser);
        if (!userId) {
            return { status: 401, data: { error: true, message: 'Invalid requester context' } };
        }

        const now = new Date();
        const [affectedRows] = await Notification.update(
            {
                is_read: true,
                read_at: now,
                updated_at: now
            },
            {
                where: {
                    user_id: userId,
                    is_read: false
                }
            }
        );

        emitToUser(userId, 'notification:mark_all_read', {
            read_at: now
        });

        return {
            status: 200,
            data: {
                error: false,
                message: 'All notifications marked as read successfully',
                affected_rows: affectedRows
            }
        };
    } catch (error) {
        console.error('Error in markAllNotificationsAsReadService:', error);
        return { status: 500, data: { error: true, message: 'Internal server error', details: error.message } };
    }
};
