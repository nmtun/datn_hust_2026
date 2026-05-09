import express from 'express';
import * as notificationController from '../controllers/NotificationControllers.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/get-all', authenticate, authorize('hr', 'manager', 'employee', 'admin'), notificationController.getNotifications);
router.get('/unread-count', authenticate, authorize('hr', 'manager', 'employee', 'admin'), notificationController.getUnreadCount);
router.put('/read/:id', authenticate, authorize('hr', 'manager', 'employee', 'admin'), notificationController.markAsRead);
router.put('/read-all', authenticate, authorize('hr', 'manager', 'employee', 'admin'), notificationController.markAllAsRead);

export default router;
