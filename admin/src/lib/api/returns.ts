import { apiFetch } from '../api';
import { PageResponse } from './types';

export type ReturnStatus = 'NEW' | 'APPROVED' | 'REJECTED' | 'REFUNDED' | 'PROCESSED';

export interface SummaryMetric {
  value: number;
  changePercent: number;
}

export interface ProcessingMetric {
  value: number;
  delta: number;
}

export interface RevenueMetric {
  current: number;
  previous: number;
  changePercent: number;
}

export interface ReturnRateMetric {
  value: number;
  previous: number;
  change: number;
}

export interface ReturnSummary {
  total: SummaryMetric;
  newReturns: SummaryMetric;
  processing: ProcessingMetric;
  amount: RevenueMetric;
  returnRate: ReturnRateMetric;
}

interface ReturnApiResponse {
  id: number;
  orderId: number;
  customerId: number;
  reason: string;
  status: ReturnStatus;
  createdAt: string;
  amount?: number | string | null;
}

export interface Return {
  id: number;
  orderId: number;
  customerId: number;
  reason: string;
  status: ReturnStatus;
  createdAt: string;
  amount?: number;
}

export interface ReturnFilters {
  page?: number;
  size?: number;
  status?: ReturnStatus;
}

export interface CreateReturnRequest {
  orderId: number;
  customerId?: number;
  reason: string;
}

const normalizeReturn = (data: ReturnApiResponse): Return => ({
  id: data.id,
  orderId: data.orderId,
  customerId: data.customerId,
  reason: data.reason,
  status: data.status,
  createdAt: data.createdAt,
  amount: data.amount != null ? Number(data.amount) : undefined,
});

const clampPage = (page?: number): number => {
  if (page === undefined || Number.isNaN(page) || page < 0) {
    return 0;
  }
  return Math.floor(page);
};

const normalizePageSize = (size?: number): number => {
  if (!size || Number.isNaN(size) || size <= 0) {
    return 20;
  }
  return Math.floor(size);
};

export const returnsApi = {
  getReturns: async (filters: ReturnFilters = {}): Promise<PageResponse<Return>> => {
    const params = new URLSearchParams();

    const page = clampPage(filters.page);
    const size = normalizePageSize(filters.size);

    params.append('page', page.toString());
    params.append('size', size.toString());
    if (filters.status) {
      params.append('status', filters.status);
    }

    const response = await apiFetch<PageResponse<ReturnApiResponse>>(`/api/returns?${params}`);

    return {
      ...response,
      content: response.content.map(normalizeReturn),
    };
  },

  getReturnById: async (id: number): Promise<Return> => {
    const response = await apiFetch<ReturnApiResponse>(`/api/returns/${id}`);
    return normalizeReturn(response);
  },

  createReturn: async (data: CreateReturnRequest): Promise<Return> => {
    const response = await apiFetch<ReturnApiResponse>('/api/returns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return normalizeReturn(response);
  },

  updateReturnStatus: async (id: number, status: ReturnStatus, notes?: string): Promise<Return> => {
    const payload: Record<string, unknown> = { status };
    if (notes) {
      payload.notes = notes;
    }

    const response = await apiFetch<ReturnApiResponse>(`/api/returns/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return normalizeReturn(response);
  },

  processReturn: async (id: number): Promise<Record<string, unknown>> => {
    return apiFetch<Record<string, unknown>>(`/api/returns/${id}/process`, {
      method: 'POST',
    });
  },

  getStats: async (): Promise<ReturnSummary> => {
    return apiFetch<ReturnSummary>('/api/returns/stats');
  },

  getPendingReturns: async (): Promise<Return[]> => {
    const response = await returnsApi.getReturns({ status: 'NEW', size: 100 });
    return response.content;
  },
};

// Backwards compatibility for existing imports
export const returnApi = returnsApi;
