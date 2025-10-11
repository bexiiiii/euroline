import { apiFetch } from '../api';
import { PageResponse } from './types';

export interface TopUpResponse {
  id: number;
  clientId: number;  // Изменено с userId на clientId для соответствия бэкенду
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  paymentMethod?: string;
  receiptUrl?: string;
  adminComment?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
}

export interface TopUpCreate {
  clientId: number;  // Изменено с userId на clientId
  amount: number;
  paymentMethod?: string;
  adminComment?: string;
  description?: string;
}

export interface ClientBalance {
  clientId: number;
  balance: number;
  updatedAt: string;
  displayName?: string;
  establishmentName?: string;
  email?: string;
  phone?: string;
}

export interface BalanceResponse {
  clientId: number;
  balance: number;
  updatedAt: string;
}

export interface BalanceAdjust {
  delta: number;
  reason: string;
}

export interface FinanceTransaction {
  id: number;
  clientId: number;
  amount: number | string;
  type: string;
  description: string;
  createdAt: string;
}

export interface TransactionProduct {
  productCode?: string;
  productName?: string;
  brand?: string;
  productId?: number;
  sku?: string;
  name?: string;
  quantity?: number;
  price?: number | string;
  total?: number | string;
}

export interface TransactionDetail extends FinanceTransaction {
  orderId?: number;
  orderPublicCode?: string;
  refundRequestId?: number;
  products?: TransactionProduct[];
}

export interface RefundRequest {
  id: number;
  clientId?: number;
  userId?: number;
  orderId?: number;
  amount: number;
  status: 'NEW' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'DONE';
  createdAt: string;
  adminComment?: string;
  reason?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  paymentMethod?: string;
}

export interface PatchStatus {
  status?: string;
  adminComment?: string;
  paymentMethod?: string;
}

export const financeApi = {
  // Top-ups
  getTopUps: async (status?: string, page = 0, size = 20): Promise<PageResponse<TopUpResponse>> => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (status) params.append('status', status);
    return apiFetch<PageResponse<TopUpResponse>>(`/api/finance/top-ups?${params}`);
  },

  createTopUp: async (data: TopUpCreate): Promise<TopUpResponse> => {
    return apiFetch<TopUpResponse>('/api/finance/top-ups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getTopUp: async (id: number): Promise<TopUpResponse> => {
    return apiFetch<TopUpResponse>(`/api/finance/top-ups/${id}`);
  },

  updateTopUpStatus: async (id: number, status: PatchStatus): Promise<TopUpResponse> => {
    return apiFetch<TopUpResponse>(`/api/finance/top-ups/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(status),
    });
  },

  // Balances
  getBalances: async (page = 0, size = 50): Promise<PageResponse<ClientBalance>> => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    return apiFetch<PageResponse<ClientBalance>>(`/api/finance/balances?${params}`);
  },

  getBalance: async (id: number): Promise<BalanceResponse> => {
    return apiFetch<BalanceResponse>(`/api/finance/balances/${id}`);
  },

  adjustBalance: async (id: number, adjustment: BalanceAdjust): Promise<BalanceResponse> => {
    return apiFetch<BalanceResponse>(`/api/finance/balances/${id}/adjust`, {
      method: 'POST',
      body: JSON.stringify(adjustment),
    });
  },

  // Transactions
  getTransactions: async (
    clientId?: number,
    page = 0,
    size = 50
  ): Promise<PageResponse<TransactionDetail>> => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (clientId) params.append('clientId', clientId.toString());
    return apiFetch<PageResponse<TransactionDetail>>(`/api/finance/transactions?${params}`);
  },

  getTransactionDetails: async (
    clientId: number,
    page = 0,
    size = 50
  ): Promise<PageResponse<TransactionDetail>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      clientId: clientId.toString(),
    });
    return apiFetch<PageResponse<TransactionDetail>>(`/api/finance/transactions?${params}`);
  },

  // Refunds
  getRefundRequests: async (status?: string, page = 0, size = 20): Promise<PageResponse<RefundRequest>> => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (status) params.append('status', status);
    return apiFetch<PageResponse<RefundRequest>>(`/api/finance/refund-requests?${params}`);
  },

  createRefund: async (data: RefundRequest): Promise<RefundRequest> => {
    return apiFetch<RefundRequest>('/api/finance/refund-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateRefundStatus: async (id: number, status: PatchStatus): Promise<RefundRequest> => {
    return apiFetch<RefundRequest>(`/api/finance/refund-requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(status),
    });
  },

  getRefundHistory: async (page = 0, size = 50): Promise<PageResponse<RefundRequest>> => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    return apiFetch<PageResponse<RefundRequest>>(`/api/finance/refund-history?${params}`);
  },

  // Stats
  getStats: async (): Promise<Record<string, unknown>> => {
    return apiFetch<Record<string, unknown>>('/api/finance/stats');
  },
};
