import { apiFetch } from '../api';

export interface AppSetting {
  key: string;
  value: string | null;
  updatedAt?: string;
}

export interface BulkSettingUpdatePayload {
  key: string;
  value: string | null;
}

export const settingsApi = {
  async list(): Promise<AppSetting[]> {
    return apiFetch<AppSetting[]>('/api/admin/settings');
  },

  async update(key: string, value: string | null): Promise<AppSetting> {
    return apiFetch<AppSetting>(`/api/admin/settings/${encodeURIComponent(key)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
  },

  async updateBulk(payload: BulkSettingUpdatePayload[]): Promise<AppSetting[]> {
    return apiFetch<AppSetting[]>('/api/admin/settings/bulk', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  async reset(): Promise<void> {
    await apiFetch('/api/admin/settings/init', {
      method: 'POST',
    });
  },
};
