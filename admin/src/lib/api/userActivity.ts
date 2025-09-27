import { apiFetch } from '../api';
import { PageResponse } from './types';

export interface UserActivity {
  id: number;
  userId: number;
  userName?: string;
  action: string;
  module: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  status: "success" | "failed" | "warning";
  createdAt: string;
}

export const userActivityApi = {
  /**
   * Get user activities with pagination
   */
  getActivities: async (userId?: number, page = 0, size = 50): Promise<PageResponse<UserActivity>> => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (userId) params.append('userId', userId.toString());
    return apiFetch<PageResponse<UserActivity>>(`/api/users/activity?${params}`);
  },

  /**
   * Get activities for specific user
   */
  getUserActivities: async (userId: number, page = 0, size = 50): Promise<PageResponse<UserActivity>> => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    return apiFetch<PageResponse<UserActivity>>(`/api/users/${userId}/activity?${params}`);
  },

  /**
   * Record new user activity
   */
  recordActivity: async (activity: Omit<UserActivity, 'id' | 'createdAt'>): Promise<UserActivity> => {
    return apiFetch<UserActivity>('/api/users/activity', {
      method: 'POST',
      body: JSON.stringify(activity),
    });
  },
};
