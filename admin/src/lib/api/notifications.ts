import { API_URL, apiFetch } from '../api';
import { PageResponse } from './types';

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  read: boolean;
  createdAt: string;
  readAt?: string;
}

export type NotificationAudience = 'ALL' | 'USERS' | 'ADMINS';

export interface SendNotificationPayload {
  title: string;
  message: string;
  audience: NotificationAudience;
  imageUrl?: string | null;
  userId?: number | null;
  status?: boolean;
}

export interface AdminNotificationHistoryItem {
  id: number;
  title: string;
  message: string;
  status: boolean;
  target: NotificationAudience | string;
  imageUrl?: string | null;
  createdAt: string | null;
  senderId?: number | null;
  senderEmail?: string | null;
  senderName?: string | null;
  recipientCount: number;
}

export const notificationsApi = {
  /**
   * Get notifications with pagination
   */
  getNotifications: async (page = 0, size = 20): Promise<PageResponse<Notification>> => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    return apiFetch<PageResponse<Notification>>(`/api/notifications?${params}`);
  },

  /**
   * Get unread notifications count
   */
  getUnreadCount: async (): Promise<{ count: number }> => {
    return apiFetch<{ count: number }>('/api/notifications/unread-count');
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (id: number): Promise<void> => {
    return apiFetch<void>(`/api/notifications/${id}/read`, {
      method: 'POST',
    });
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<void> => {
    return apiFetch<void>('/api/notifications/read-all', {
      method: 'POST',
    });
  },

  /**
   * Send notification to selected audience
   */
  sendAdminNotification: async (payload: SendNotificationPayload): Promise<void> => {
    return apiFetch<void>('/api/admin/notifications/send', {
      method: 'POST',
      body: JSON.stringify({
        title: payload.title,
        message: payload.message,
        status: payload.status ?? true,
        userId: payload.userId ?? null,
        target: payload.audience,
        imageUrl: payload.imageUrl ?? null,
      }),
    });
  },

  /**
   * Fetch admin notification history
   */
  getAdminNotificationHistory: async (page = 0, size = 25): Promise<PageResponse<AdminNotificationHistoryItem>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    return apiFetch<PageResponse<AdminNotificationHistoryItem>>(`/api/admin/notifications/history?${params.toString()}`);
  },

  /**
   * Get real-time notifications stream
   */
  getNotificationsStream: (): EventSource => {
    const token = localStorage.getItem('admin_token');
    const url = new URL('/api/notifications/stream', API_URL);
    if (token) {
      url.searchParams.append('token', token);
    }
    return new EventSource(url.toString());
  },
};
