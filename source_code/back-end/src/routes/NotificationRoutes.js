import express from 'express';
import * as notificationController from '../controllers/NotificationControllers.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/get-all', authenticate, authorize('hr', 'manager', 'employee'), notificationController.getNotifications);
router.get('/unread-count', authenticate, authorize('hr', 'manager', 'employee'), notificationController.getUnreadCount);
router.put('/read/:id', authenticate, authorize('hr', 'manager', 'employee'), notificationController.markAsRead);
router.put('/read-all', authenticate, authorize('hr', 'manager', 'employee'), notificationController.markAllAsRead);

export default router;
