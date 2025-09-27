import { apiFetch } from '../api';

export interface SiteSetting {
  id: number;
  key: string;
  value: string;
  description: string;
  type: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  category: string;
}

export interface SiteSettingFilters {
  category?: string;
}

export const siteSettingsApi = {
  /**
   * Get all site settings
   */
  getSettings: async (filters: SiteSettingFilters = {}): Promise<SiteSetting[]> => {
    const queryParams = new URLSearchParams();
    
    if (filters.category) queryParams.append('category', filters.category);
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiFetch<SiteSetting[]>(`/api/admin/settings${query}`);
  },

  /**
   * Get a specific setting by key
   */
  getSettingByKey: async (key: string): Promise<SiteSetting> => {
    return apiFetch<SiteSetting>(`/api/admin/settings/${key}`);
  },

  /**
   * Update a site setting
   */
  updateSetting: async (key: string, value: string): Promise<SiteSetting> => {
    return apiFetch<SiteSetting>(`/api/admin/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  },

  /**
   * Update multiple settings at once
   */
  updateBulkSettings: async (settings: { key: string, value: string }[]): Promise<SiteSetting[]> => {
    return apiFetch<SiteSetting[]>('/api/admin/settings/bulk', {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    });
  },

  /**
   * Get setting categories
   */
  getCategories: async (): Promise<string[]> => {
    return apiFetch<string[]>('/api/admin/settings/categories');
  },
};
