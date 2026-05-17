import express from 'express';
import * as notificationController from '../controllers/NotificationControllers.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/get-all', authenticate, authorize('hr', 'manager', 'employee', 'tenant_admin'), notificationController.getNotifications);
router.get('/unread-count', authenticate, authorize('hr', 'manager', 'employee', 'tenant_admin'), notificationController.getUnreadCount);
router.put('/read/:id', authenticate, authorize('hr', 'manager', 'employee', 'tenant_admin'), notificationController.markAsRead);
router.put('/read-all', authenticate, authorize('hr', 'manager', 'employee', 'tenant_admin'), notificationController.markAllAsRead);

export default router;
