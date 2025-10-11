import { API_URL } from '../api';
import { PageResponse } from './types';

export interface Payment {
  id: string;
  orderId: number;
  userId: number;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'PARTIAL_REFUND';
  paymentMethod: 'CREDIT_CARD' | 'PAYPAL' | 'BANK_TRANSFER' | 'CASH' | 'WALLET' | 'CRYPTOCURRENCY';
  gatewayProvider: string;
  gatewayTransactionId?: string;
  gatewayResponse?: string;
  failureReason?: string;
  refundAmount?: number;
  refundReason?: string;
  createdAt: string;
  processedAt?: string;
  refundedAt?: string;
  metadata?: Record<string, any>;
}

export interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  paymentsToday: number;
  amountToday: number;
  successRate: number;
  averageAmount: number;
  totalRefunds: number;
  refundAmount: number;
  paymentsByMethod: {
    method: string;
    count: number;
    amount: number;
  }[];
  paymentsByStatus: {
    status: string;
    count: number;
    amount: number;
  }[];
  revenueByDay: {
    date: string;
    amount: number;
    count: number;
  }[];
}

export interface RefundRequest {
  paymentId: string;
  amount: number;
  reason: string;
  notifyCustomer: boolean;
}

export interface PaymentGateway {
  id: string;
  name: string;
  isActive: boolean;
  supportedMethods: string[];
  configuration: Record<string, any>;
  fees: {
    percentage: number;
    fixed: number;
  };
  dailyLimit?: number;
  monthlyLimit?: number;
}

const BASE_URL = `${API_URL}/api/admin`;

export const paymentsApi = {
  getPayments: async (
    page = 0,
    size = 20,
    sort = 'createdAt,desc',
    status?: string,
    paymentMethod?: string,
    gatewayProvider?: string,
    startDate?: string,
    endDate?: string,
    minAmount?: number,
    maxAmount?: number
  ): Promise<PageResponse<Payment>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort,
    });
    
    if (status) params.append('status', status);
    if (paymentMethod) params.append('paymentMethod', paymentMethod);
    if (gatewayProvider) params.append('gatewayProvider', gatewayProvider);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (minAmount) params.append('minAmount', minAmount.toString());
    if (maxAmount) params.append('maxAmount', maxAmount.toString());

    const response = await fetch(`${BASE_URL}/payments?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch payments');
    return response.json();
  },

  getPayment: async (id: string): Promise<Payment> => {
    const response = await fetch(`${BASE_URL}/payments/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch payment');
    return response.json();
  },

  getOrderPayments: async (orderId: number): Promise<Payment[]> => {
    const response = await fetch(`${BASE_URL}/payments/order/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch order payments');
    return response.json();
  },

  getUserPayments: async (userId: number, page = 0, size = 20): Promise<PageResponse<Payment>> => {
    const response = await fetch(`${BASE_URL}/payments/user/${userId}?page=${page}&size=${size}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch user payments');
    return response.json();
  },

  getPaymentStats: async (days = 30): Promise<PaymentStats> => {
    const response = await fetch(`${BASE_URL}/payments/stats?days=${days}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch payment statistics');
    return response.json();
  },

  getFailedPayments: async (page = 0, size = 20, days = 30): Promise<PageResponse<Payment>> => {
    const response = await fetch(`${BASE_URL}/payments/failed?page=${page}&size=${size}&days=${days}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch failed payments');
    return response.json();
  },

  getPendingPayments: async (page = 0, size = 20): Promise<PageResponse<Payment>> => {
    const response = await fetch(`${BASE_URL}/payments/pending?page=${page}&size=${size}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch pending payments');
    return response.json();
  },

  refundPayment: async (request: RefundRequest): Promise<Payment> => {
    const response = await fetch(`${BASE_URL}/payments/${request.paymentId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Failed to refund payment');
    return response.json();
  },

  cancelPayment: async (id: string, reason: string): Promise<Payment> => {
    const response = await fetch(`${BASE_URL}/payments/${id}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) throw new Error('Failed to cancel payment');
    return response.json();
  },

  retryPayment: async (id: string): Promise<Payment> => {
    const response = await fetch(`${BASE_URL}/payments/${id}/retry`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to retry payment');
    return response.json();
  },

  capturePayment: async (id: string, amount?: number): Promise<Payment> => {
    const response = await fetch(`${BASE_URL}/payments/${id}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(amount ? { amount } : {}),
    });
    if (!response.ok) throw new Error('Failed to capture payment');
    return response.json();
  },

  getPaymentGateways: async (): Promise<PaymentGateway[]> => {
    const response = await fetch(`${BASE_URL}/payment-gateways`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch payment gateways');
    return response.json();
  },

  updatePaymentGateway: async (id: string, gateway: Partial<PaymentGateway>): Promise<PaymentGateway> => {
    const response = await fetch(`${BASE_URL}/payment-gateways/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(gateway),
    });
    if (!response.ok) throw new Error('Failed to update payment gateway');
    return response.json();
  },

  testPaymentGateway: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${BASE_URL}/payment-gateways/${id}/test`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to test payment gateway');
    return response.json();
  },

  exportPayments: async (
    startDate?: string,
    endDate?: string,
    status?: string,
    format: 'CSV' | 'EXCEL' = 'CSV'
  ): Promise<Blob> => {
    const params = new URLSearchParams({ format });
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (status) params.append('status', status);

    const response = await fetch(`${BASE_URL}/payments/export?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to export payments');
    return response.blob();
  },

  reconcilePayments: async (date: string, gatewayProvider?: string): Promise<{
    totalPayments: number;
    reconciledPayments: number;
    discrepancies: {
      paymentId: string;
      ourAmount: number;
      gatewayAmount: number;
      difference: number;
    }[];
  }> => {
    const params = new URLSearchParams({ date });
    if (gatewayProvider) params.append('gatewayProvider', gatewayProvider);

    const response = await fetch(`${BASE_URL}/payments/reconcile?${params}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to reconcile payments');
    return response.json();
  },
};
