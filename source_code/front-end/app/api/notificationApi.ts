import apiClient from './axios';

export type NotificationType =
  | 'task_assigned'
  | 'task_reassigned'
  | 'task_status_changed'
  | 'task_commented'
  | 'task_reviewed'
  | 'task_updated'
  | 'candidate_applied'
  | 'performance_period_created'
  | 'performance_review_reminder'
  | 'compensation_recommendation';

export interface NotificationActor {
  user_id: number;
  full_name: string;
  company_email?: string;
}

export interface NotificationItem {
  notification_id: number;
  user_id: number;
  actor_id?: number | null;
  type: NotificationType;
  title: string;
  message: string;
  entity_type?: string | null;
  entity_id?: number | null;
  metadata?: Record<string, unknown> | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
  updated_at?: string | null;
  actor?: NotificationActor | null;
}

interface NotificationListResponse {
  error: boolean;
  message: string;
  notifications: NotificationItem[];
  total: number;
  unread_count: number;
  limit: number;
  offset: number;
}

interface NotificationUnreadCountResponse {
  error: boolean;
  message: string;
  unread_count: number;
}

export const notificationApi = {
  getAll: async (params?: { limit?: number; offset?: number; unread_only?: boolean }) => {
    const response = await apiClient.get<NotificationListResponse>('/api/notification/get-all', { params });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await apiClient.get<NotificationUnreadCountResponse>('/api/notification/unread-count');
    return response.data;
  },

  markAsRead: async (id: number) => {
    const response = await apiClient.put(`/api/notification/read/${id}`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await apiClient.put('/api/notification/read-all');
    return response.data;
  },
};
