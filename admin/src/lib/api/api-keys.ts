import { apiFetch } from '../api';

export interface ApiKeyItem {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
  createdBy?: string;
  expiresAt?: string;
  lastUsedAt?: string;
  lastUsedIp?: string;
  requestCount: number;
  revokedAt?: string;
}

export interface ApiKeyMetrics {
  totalKeys: number;
  activeKeys: number;
  revokedKeys: number;
  recentlyUsedKeys: number;
  requestsToday: number;
  requests7Days: number;
  errorCountToday: number;
  uptimePercentage: number;
}

export interface ApiKeyLogEntry {
  id: number;
  requestedAt: string;
  requestPath?: string;
  requestMethod?: string;
  responseStatus?: number;
  clientIp?: string;
}

export interface CreateApiKeyPayload {
  name: string;
  description?: string;
  createdBy?: string;
}

export interface UpdateApiKeyPayload {
  name?: string;
  description?: string;
  active?: boolean;
}

interface ApiKeyCreationResponse {
  id: number;
  apiKey: string;
}

export const apiKeysApi = {
  async list(): Promise<ApiKeyItem[]> {
    return apiFetch<ApiKeyItem[]>('/api/admin/api/keys');
  },

  async metrics(): Promise<ApiKeyMetrics> {
    return apiFetch<ApiKeyMetrics>('/api/admin/api/keys/metrics');
  },

  async logs(id: number): Promise<ApiKeyLogEntry[]> {
    return apiFetch<ApiKeyLogEntry[]>(`/api/admin/api/keys/${id}/logs`);
  },

  async create(payload: CreateApiKeyPayload): Promise<ApiKeyCreationResponse> {
    return apiFetch<ApiKeyCreationResponse>('/api/admin/api/keys', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });
  },

  async update(id: number, payload: UpdateApiKeyPayload): Promise<ApiKeyItem> {
    return apiFetch<ApiKeyItem>(`/api/admin/api/keys/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });
  },

  async rotate(id: number): Promise<ApiKeyCreationResponse> {
    return apiFetch<ApiKeyCreationResponse>(`/api/admin/api/keys/${id}/rotate`, {
      method: 'POST',
    });
  },

  async revoke(id: number): Promise<void> {
    await apiFetch<void>(`/api/admin/api/keys/${id}`, {
      method: 'DELETE',
    });
  },
};
