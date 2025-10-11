import { API_URL } from '../api';
import { PageResponse } from './types';

export interface AccountBalance {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  balance: number;
  pendingAmount: number;
  creditLimit: number;
  currency: string;
  isActive: boolean;
  lastTransactionDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BalanceTransaction {
  id: number;
  userId: number;
  userName: string;
  type: 'CREDIT' | 'DEBIT' | 'REFUND' | 'ADJUSTMENT' | 'PURCHASE' | 'WITHDRAWAL';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  orderId?: number;
  paymentId?: string;
  adminId?: number;
  adminName?: string;
  reference?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  createdAt: string;
  processedAt?: string;
}

export interface CreateBalanceAdjustmentRequest {
  userId: number;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  description: string;
  reference?: string;
}

export interface BalanceStats {
  totalUsers: number;
  totalBalance: number;
  totalPendingAmount: number;
  averageBalance: number;
  usersWithPositiveBalance: number;
  usersWithNegativeBalance: number;
  totalTransactionsToday: number;
  totalTransactionVolume: number;
}

export interface BulkBalanceUpdateRequest {
  adjustments: {
    userId: number;
    amount: number;
    description: string;
  }[];
}

const BASE_URL = `${API_URL}/api/admin`;

export const accountBalancesApi = {
  getAccountBalances: async (
    page = 0, 
    size = 20, 
    sort = 'balance,desc',
    search?: string,
    minBalance?: number,
    maxBalance?: number
  ): Promise<PageResponse<AccountBalance>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort,
    });
    
    if (search) params.append('search', search);
    if (minBalance !== undefined) params.append('minBalance', minBalance.toString());
    if (maxBalance !== undefined) params.append('maxBalance', maxBalance.toString());

    const response = await fetch(`${BASE_URL}/account-balances?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch account balances');
    return response.json();
  },

  getAccountBalance: async (userId: number): Promise<AccountBalance> => {
    const response = await fetch(`${BASE_URL}/account-balances/${userId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch account balance');
    return response.json();
  },

  getBalanceTransactions: async (
    page = 0,
    size = 20,
    sort = 'createdAt,desc',
    userId?: number,
    type?: string,
    status?: string,
    startDate?: string,
    endDate?: string
  ): Promise<PageResponse<BalanceTransaction>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort,
    });
    
    if (userId) params.append('userId', userId.toString());
    if (type) params.append('type', type);
    if (status) params.append('status', status);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetch(`${BASE_URL}/balance-transactions?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch balance transactions');
    return response.json();
  },

  getUserBalanceTransactions: async (userId: number, page = 0, size = 20): Promise<PageResponse<BalanceTransaction>> => {
    const response = await fetch(`${BASE_URL}/account-balances/${userId}/transactions?page=${page}&size=${size}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch user balance transactions');
    return response.json();
  },

  getBalanceStats: async (): Promise<BalanceStats> => {
    const response = await fetch(`${BASE_URL}/account-balances/stats`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch balance statistics');
    return response.json();
  },

  adjustBalance: async (request: CreateBalanceAdjustmentRequest): Promise<BalanceTransaction> => {
    const response = await fetch(`${BASE_URL}/account-balances/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Failed to adjust balance');
    return response.json();
  },

  creditBalance: async (userId: number, amount: number, description: string, reference?: string): Promise<BalanceTransaction> => {
    const response = await fetch(`${BASE_URL}/account-balances/${userId}/credit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
      body: JSON.stringify({ amount, description, reference }),
    });
    if (!response.ok) throw new Error('Failed to credit balance');
    return response.json();
  },

  debitBalance: async (userId: number, amount: number, description: string, reference?: string): Promise<BalanceTransaction> => {
    const response = await fetch(`${BASE_URL}/account-balances/${userId}/debit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
      body: JSON.stringify({ amount, description, reference }),
    });
    if (!response.ok) throw new Error('Failed to debit balance');
    return response.json();
  },

  updateCreditLimit: async (userId: number, creditLimit: number): Promise<AccountBalance> => {
    const response = await fetch(`${BASE_URL}/account-balances/${userId}/credit-limit`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
      body: JSON.stringify({ creditLimit }),
    });
    if (!response.ok) throw new Error('Failed to update credit limit');
    return response.json();
  },

  freezeAccount: async (userId: number): Promise<AccountBalance> => {
    const response = await fetch(`${BASE_URL}/account-balances/${userId}/freeze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to freeze account');
    return response.json();
  },

  unfreezeAccount: async (userId: number): Promise<AccountBalance> => {
    const response = await fetch(`${BASE_URL}/account-balances/${userId}/unfreeze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to unfreeze account');
    return response.json();
  },

  bulkBalanceUpdate: async (request: BulkBalanceUpdateRequest): Promise<{ successCount: number; errors: string[] }> => {
    const response = await fetch(`${BASE_URL}/account-balances/bulk-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Failed to perform bulk balance update');
    return response.json();
  },

  exportBalances: async (format: 'CSV' | 'EXCEL' = 'CSV'): Promise<Blob> => {
    const response = await fetch(`${BASE_URL}/account-balances/export?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to export account balances');
    return response.blob();
  },

  exportTransactions: async (
    userId?: number,
    startDate?: string,
    endDate?: string,
    format: 'CSV' | 'EXCEL' = 'CSV'
  ): Promise<Blob> => {
    const params = new URLSearchParams({ format });
    
    if (userId) params.append('userId', userId.toString());
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetch(`${BASE_URL}/balance-transactions/export?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to export balance transactions');
    return response.blob();
  },
};
