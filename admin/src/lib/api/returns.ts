import { apiFetch } from '../api';
import { PageResponse } from './types';

export interface ReturnRequest {
  id: number;
  userId: number;
  orderId: number;
  reason: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
  processedBy?: number;
  refundAmount?: number;
}

export interface CreateReturn {
  orderId: number;
  reason: string;
  description: string;
}

export interface PatchStatus {
  status: string;
  comments?: string;
}

export const returnsApi = {
  /**
   * Get all returns with pagination and filtering
   */
  getReturns: async (status?: string, page = 0, size = 20): Promise<PageResponse<ReturnRequest>> => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (status) params.append('status', status);
    return apiFetch<PageResponse<ReturnRequest>>(`/api/returns?${params}`);
  },

  /**
   * Get a specific return by ID
   */
  getReturn: async (id: number): Promise<ReturnRequest> => {
    return apiFetch<ReturnRequest>(`/api/returns/${id}`);
  },

  /**
   * Create a new return request
   */
  createReturn: async (data: CreateReturn): Promise<ReturnRequest> => {
    return apiFetch<ReturnRequest>('/api/returns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update return status
   */
  updateReturnStatus: async (id: number, status: PatchStatus): Promise<ReturnRequest> => {
    return apiFetch<ReturnRequest>(`/api/returns/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(status),
    });
  },

  /**
   * Process return
   */
  processReturn: async (id: number): Promise<Record<string, any>> => {
    return apiFetch<Record<string, any>>(`/api/returns/${id}/process`, {
      method: 'POST',
    });
  },

  /**
   * Get returns statistics
   */
  getStats: async (): Promise<Record<string, any>> => {
    return apiFetch<Record<string, any>>('/api/returns/stats');
  },
};
