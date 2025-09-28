import { PageResponse } from './types';

export interface ApiKey {
  id: number;
  name: string;
  key: string;
  secretHash: string;
  isActive: boolean;
  permissions: string[];
  rateLimit: number;
  requestsUsed: number;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
  createdBy: string;
  ipWhitelist?: string[];
}

export interface ApiRequest {
  id: string;
  apiKeyId: number;
  apiKeyName: string;
  endpoint: string;
  method: string;
  ipAddress: string;
  userAgent: string;
  requestBody?: string;
  responseStatus: number;
  responseTime: number;
  timestamp: string;
  errorMessage?: string;
}

export interface CreateApiKeyRequest {
  name: string;
  permissions: string[];
  rateLimit: number;
  expiresAt?: string;
  ipWhitelist?: string[];
}

export interface UpdateApiKeyRequest {
  name?: string;
  permissions?: string[];
  rateLimit?: number;
  isActive?: boolean;
  expiresAt?: string;
  ipWhitelist?: string[];
}

export interface ApiStats {
  totalApiKeys: number;
  activeApiKeys: number;
  totalRequests: number;
  requestsToday: number;
  averageResponseTime: number;
  errorRate: number;
  topEndpoints: {
    endpoint: string;
    count: number;
    averageResponseTime: number;
  }[];
  requestsByHour: {
    hour: string;
    count: number;
  }[];
}

const BASE_URL = 'http://localhost:8080/api/admin';

export const apiManagementApi = {
  getApiKeys: async (page = 0, size = 20, sort = 'createdAt,desc'): Promise<PageResponse<ApiKey>> => {
    const response = await fetch(`${BASE_URL}/api-keys?page=${page}&size=${size}&sort=${sort}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch API keys');
    return response.json();
  },

  getApiKey: async (id: number): Promise<ApiKey> => {
    const response = await fetch(`${BASE_URL}/api-keys/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch API key');
    return response.json();
  },

  createApiKey: async (request: CreateApiKeyRequest): Promise<{ apiKey: ApiKey; secret: string }> => {
    const response = await fetch(`${BASE_URL}/api-keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Failed to create API key');
    return response.json();
  },

  updateApiKey: async (id: number, request: UpdateApiKeyRequest): Promise<ApiKey> => {
    const response = await fetch(`${BASE_URL}/api-keys/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Failed to update API key');
    return response.json();
  },

  deleteApiKey: async (id: number): Promise<void> => {
    const response = await fetch(`${BASE_URL}/api-keys/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to delete API key');
  },

  regenerateApiKey: async (id: number): Promise<{ apiKey: ApiKey; secret: string }> => {
    const response = await fetch(`${BASE_URL}/api-keys/${id}/regenerate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to regenerate API key');
    return response.json();
  },

  toggleApiKeyStatus: async (id: number): Promise<ApiKey> => {
    const response = await fetch(`${BASE_URL}/api-keys/${id}/toggle-status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to toggle API key status');
    return response.json();
  },

  getApiRequests: async (
    page = 0,
    size = 20,
    sort = 'timestamp,desc',
    apiKeyId?: number,
    endpoint?: string,
    method?: string,
    status?: number,
    startDate?: string,
    endDate?: string
  ): Promise<PageResponse<ApiRequest>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort,
    });
    
    if (apiKeyId) params.append('apiKeyId', apiKeyId.toString());
    if (endpoint) params.append('endpoint', endpoint);
    if (method) params.append('method', method);
    if (status) params.append('status', status.toString());
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetch(`${BASE_URL}/api-requests?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch API requests');
    return response.json();
  },

  getApiKeyRequests: async (apiKeyId: number, page = 0, size = 20): Promise<PageResponse<ApiRequest>> => {
    const response = await fetch(`${BASE_URL}/api-keys/${apiKeyId}/requests?page=${page}&size=${size}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch API key requests');
    return response.json();
  },

  getApiStats: async (days = 30): Promise<ApiStats> => {
    const response = await fetch(`${BASE_URL}/api-stats?days=${days}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch API statistics');
    return response.json();
  },

  getApiKeyStats: async (apiKeyId: number, days = 30): Promise<{
    totalRequests: number;
    requestsToday: number;
    averageResponseTime: number;
    errorRate: number;
    requestsByDay: { date: string; count: number }[];
  }> => {
    const response = await fetch(`${BASE_URL}/api-keys/${apiKeyId}/stats?days=${days}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch API key statistics');
    return response.json();
  },

  getAvailablePermissions: async (): Promise<string[]> => {
    const response = await fetch(`${BASE_URL}/api-permissions`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch available permissions');
    return response.json();
  },

  clearApiRequestLogs: async (days: number): Promise<{ deletedCount: number }> => {
    const response = await fetch(`${BASE_URL}/api-requests/cleanup?days=${days}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to clear API request logs');
    return response.json();
  },

  exportApiRequests: async (
    apiKeyId?: number,
    startDate?: string,
    endDate?: string,
    format: 'CSV' | 'JSON' = 'CSV'
  ): Promise<Blob> => {
    const params = new URLSearchParams({ format });
    
    if (apiKeyId) params.append('apiKeyId', apiKeyId.toString());
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetch(`${BASE_URL}/api-requests/export?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to export API requests');
    return response.blob();
  },
};
