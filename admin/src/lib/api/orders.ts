import { apiFetch } from '../api';
import { PageResponse } from './types';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED' | 'PARTIALLY_PAID';

export interface OrderItem {
  id: number;
  productId: number | null;
  productName: string | null;
  productCode: string | null;
  sku: string | null;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  id: number;
  userId?: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  code?: string;
  deliveryAddress?: string;
  totalAmount: number;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  items: OrderItem[];
}

export interface OrderFilters {
  page?: number;
  size?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
  fromDate?: string;
  toDate?: string;
  sort?: string;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

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

export interface OrderSummary {
  total: SummaryMetric;
  newOrders: SummaryMetric;
  processing: ProcessingMetric;
  completed: SummaryMetric;
  revenue: RevenueMetric;
}

type OrderItemApiResponse = Omit<OrderItem, 'price' | 'total'> & {
  price: number | string | null;
  total: number | string | null;
};

type OrderApiResponse = Omit<Order, 'totalAmount' | 'items'> & {
  totalAmount: number | string | null;
  items?: OrderItemApiResponse[] | null;
};

const normalizeOrder = (order: OrderApiResponse): Order => ({
  ...order,
  totalAmount: order.totalAmount != null ? Number(order.totalAmount) : 0,
  items: (order.items ?? []).map((item) => ({
    ...item,
    price: item.price != null ? Number(item.price) : 0,
    total:
      item.total != null
        ? Number(item.total)
        : item.price != null
        ? Number(item.price) * item.quantity
        : 0,
  })),
});

export const ordersApi = {
  /**
   * Get orders with pagination and filtering
   */
  getOrders: async (filters: OrderFilters = {}): Promise<PageResponse<Order>> => {
    const params = new URLSearchParams();
    
    if (filters.page !== undefined) params.append('page', filters.page.toString());
    if (filters.size !== undefined) params.append('size', filters.size.toString());
    if (filters.status) params.append('status', filters.status);
    if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
    if (filters.search) params.append('q', filters.search);
    if (filters.fromDate) params.append('from', filters.fromDate);
    if (filters.toDate) params.append('to', filters.toDate);
    if (filters.sort) params.append('sort', filters.sort);
    
    const response = await apiFetch<PageResponse<OrderApiResponse>>(`/api/orders?${params}`);
    return {
      ...response,
      content: response.content.map(normalizeOrder),
    };
  },

  /**
   * Get order by ID
   */
  getOrder: async (id: number): Promise<Order> => {
    const response = await apiFetch<OrderApiResponse>(`/api/admin/orders/${id}`);
    return normalizeOrder(response);
  },

  /**
   * Update order status
   */
  // На бэкенде есть только подтверждение и отмена заказа (/api/admin/orders/{id}/confirm|cancel).
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateOrderStatus: async (id: number, status: string, _notes?: string): Promise<Order> => {
    if (status === 'CONFIRMED' || status === 'CANCELLED') {
      const action = status === 'CONFIRMED' ? 'confirm' : 'cancel';
      await apiFetch<void>(`/api/admin/orders/${id}/${action}`, { method: 'POST', parseAs: 'text' });
      const response = await apiFetch<OrderApiResponse>(`/api/admin/orders/${id}`);
      return normalizeOrder(response);
    }
    throw new Error('Заказ можно только подтвердить или отменить');
  },

  /**
   * Update payment status
   */
  // Эндпоинта для ручной смены статуса оплаты на бэкенде нет: статус приходит из оплаты/1С.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updatePaymentStatus: async (_id: number, _paymentStatus: string): Promise<Order> => {
    throw new Error('Статус оплаты меняется автоматически');
  },

  /**
   * Get order statistics
   */
  getStats: async (): Promise<OrderStats> => {
    return apiFetch<OrderStats>('/api/orders/stats');
  },

  getSummary: async (): Promise<OrderSummary> => {
    return apiFetch<OrderSummary>('/api/admin/analytics/orders-summary');
  },

  /**
   * Cancel order
   */
  cancelOrder: async (id: number, reason: string): Promise<Order> => {
    const response = await apiFetch<OrderApiResponse>(`/api/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return normalizeOrder(response);
  },

  /**
   * Export orders with applied filters as CSV
   */
  exportOrders: async (filters: OrderFilters = {}): Promise<Blob> => {
    const params = new URLSearchParams();

    if (filters.status) params.append('status', filters.status);
    if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
    if (filters.search) params.append('q', filters.search);
    if (filters.fromDate) params.append('from', filters.fromDate);
    if (filters.toDate) params.append('to', filters.toDate);
    if (filters.sort) params.append('sort', filters.sort);

    return apiFetch<Blob>('/api/orders/export', {
      method: 'POST',
      body: params.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      parseAs: 'blob',
    });
  },
};
