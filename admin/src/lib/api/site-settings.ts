export interface SiteSetting {
  id: number;
  key: string;
  value: string;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'TEXT' | 'EMAIL' | 'URL';
  category: string;
  description?: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingRequest {
  value: string;
}

export interface SettingGroup {
  category: string;
  settings: SiteSetting[];
}

export interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  enableSsl: boolean;
  enableStartTls: boolean;
}

export interface PaymentSettings {
  enableCreditCard: boolean;
  enablePayPal: boolean;
  enableBankTransfer: boolean;
  enableCash: boolean;
  currency: string;
  taxRate: number;
  shippingCost: number;
  freeShippingThreshold: number;
}

export interface GeneralSettings {
  siteName: string;
  siteDescription: string;
  siteKeywords: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  timezone: string;
  language: string;
  maintenanceMode: boolean;
}

import { API_URL } from '../api';

const BASE_URL = `${API_URL}/api/admin`;

export const settingsApi = {
  getAllSettings: async (): Promise<SiteSetting[]> => {
    const response = await fetch(`${BASE_URL}/settings`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json();
  },

  getSettingsByCategory: async (category: string): Promise<SiteSetting[]> => {
    const response = await fetch(`${BASE_URL}/settings/category/${category}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch settings by category');
    return response.json();
  },

  getSettingsGrouped: async (): Promise<SettingGroup[]> => {
    const response = await fetch(`${BASE_URL}/settings/grouped`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch grouped settings');
    return response.json();
  },

  getSetting: async (key: string): Promise<SiteSetting> => {
    const response = await fetch(`${BASE_URL}/settings/${key}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch setting');
    return response.json();
  },

  updateSetting: async (key: string, request: UpdateSettingRequest): Promise<SiteSetting> => {
    const response = await fetch(`${BASE_URL}/settings/${key}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Failed to update setting');
    return response.json();
  },

  updateMultipleSettings: async (settings: { key: string; value: string }[]): Promise<SiteSetting[]> => {
    const response = await fetch(`${BASE_URL}/settings/bulk`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ settings }),
    });
    if (!response.ok) throw new Error('Failed to update settings');
    return response.json();
  },

  getGeneralSettings: async (): Promise<GeneralSettings> => {
    const response = await fetch(`${BASE_URL}/settings/general`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch general settings');
    return response.json();
  },

  updateGeneralSettings: async (settings: Partial<GeneralSettings>): Promise<GeneralSettings> => {
    const response = await fetch(`${BASE_URL}/settings/general`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(settings),
    });
    if (!response.ok) throw new Error('Failed to update general settings');
    return response.json();
  },

  getEmailSettings: async (): Promise<EmailSettings> => {
    const response = await fetch(`${BASE_URL}/settings/email`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch email settings');
    return response.json();
  },

  updateEmailSettings: async (settings: Partial<EmailSettings>): Promise<EmailSettings> => {
    const response = await fetch(`${BASE_URL}/settings/email`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(settings),
    });
    if (!response.ok) throw new Error('Failed to update email settings');
    return response.json();
  },

  testEmailSettings: async (): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${BASE_URL}/settings/email/test`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to test email settings');
    return response.json();
  },

  getPaymentSettings: async (): Promise<PaymentSettings> => {
    const response = await fetch(`${BASE_URL}/settings/payment`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch payment settings');
    return response.json();
  },

  updatePaymentSettings: async (settings: Partial<PaymentSettings>): Promise<PaymentSettings> => {
    const response = await fetch(`${BASE_URL}/settings/payment`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(settings),
    });
    if (!response.ok) throw new Error('Failed to update payment settings');
    return response.json();
  },

  resetToDefaults: async (category?: string): Promise<SiteSetting[]> => {
    const url = category 
      ? `${BASE_URL}/settings/reset?category=${category}`
      : `${BASE_URL}/settings/reset`;
      
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to reset settings');
    return response.json();
  },

  exportSettings: async (): Promise<Blob> => {
    const response = await fetch(`${BASE_URL}/settings/export`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to export settings');
    return response.blob();
  },

  importSettings: async (file: File): Promise<{ imported: number; errors: string[] }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BASE_URL}/settings/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to import settings');
    return response.json();
  },
};
