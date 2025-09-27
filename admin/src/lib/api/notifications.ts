import { apiFetch } from '../api';
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
   * Get real-time notifications stream
   */
  getNotificationsStream: (): EventSource => {
    const token = localStorage.getItem('admin_token');
    const url = new URL('/api/notifications/stream', process.env.NEXT_PUBLIC_API_URL);
    if (token) {
      url.searchParams.append('token', token);
    }
    return new EventSource(url.toString());
  },
};
