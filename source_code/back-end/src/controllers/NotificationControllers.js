import * as notificationService from '../services/NotificationServices.js';

export const getNotifications = async (req, res) => {
    try {
        const result = await notificationService.getNotificationsService(req.query, req.user);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error('Error getting notifications:', error);
        return res.status(500).json({ error: true, message: 'Internal server error' });
    }
};

export const getUnreadCount = async (req, res) => {
    try {
        const result = await notificationService.getUnreadCountService(req.user);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error('Error getting unread count:', error);
        return res.status(500).json({ error: true, message: 'Internal server error' });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const result = await notificationService.markNotificationAsReadService(req.params.id, req.user);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return res.status(500).json({ error: true, message: 'Internal server error' });
    }
};

export const markAllAsRead = async (req, res) => {
    try {
        const result = await notificationService.markAllNotificationsAsReadService(req.user);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        return res.status(500).json({ error: true, message: 'Internal server error' });
    }
};
