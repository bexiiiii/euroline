import { apiFetch } from '../api';
import { PageResponse } from './types';
import { User } from './users';

export type Customer = User;

export interface CustomerFilters {
  page?: number;
  size?: number;
  search?: string;
  status?: 'active' | 'banned';
  sort?: string;
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers?: number;
  bannedCustomers?: number;
  totalSearchQueries?: number;
}

export interface CustomerSearchHistory {
  id: number;
  customerId: number | null;
  clientName: string | null;
  query: string;
  createdAt: string;
}

export interface NewsletterPayload {
  subject?: string;
  message: string;
}

export interface NewsletterResponse {
  sent: boolean;
  recipients?: number;
  subject?: string;
  message?: string;
}

const buildParams = (filters: CustomerFilters = {}) => {
  const params = new URLSearchParams();
  if (filters.page !== undefined) params.append('page', filters.page.toString());
  if (filters.size !== undefined) params.append('size', filters.size.toString());
  if (filters.search && filters.search.trim()) params.append('q', filters.search.trim());
  if (filters.status && filters.status !== 'active' && filters.status !== 'banned') {
    console.warn(`Unsupported customer status filter: ${filters.status}`);
  } else if (filters.status) {
    params.append('status', filters.status);
  }
  if (filters.sort) params.append('sort', filters.sort);
  return params;
};

export const customersApi = {
  /**
   * Получить список клиентов с фильтрами и пагинацией
   */
  async getCustomers(filters: CustomerFilters = {}): Promise<PageResponse<Customer>> {
    const params = buildParams(filters);
    const query = params.toString();
    return apiFetch<PageResponse<Customer>>(`/api/customers${query ? `?${query}` : ''}`);
  },

  /**
   * Получить клиента по ID
   */
  async getCustomer(id: number): Promise<Customer> {
    return apiFetch<Customer>(`/api/customers/${id}`);
  },

  /**
   * Создать клиента
   */
  async createCustomer(payload: Partial<Customer> & { password?: string }): Promise<Customer> {
    return apiFetch<Customer>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Обновить клиента
   */
  async updateCustomer(id: number, payload: Partial<Customer>): Promise<Customer> {
    return apiFetch<Customer>(`/api/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Удалить клиента
   */
  async deleteCustomer(id: number): Promise<void> {
    await apiFetch<void>(`/api/customers/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Обновить статус клиента (active/banned)
   */
  async updateStatus(id: number, status: 'active' | 'banned'): Promise<{ id: number; banned: boolean; status: string }> {
    return apiFetch<{ id: number; banned: boolean; status: string }>(`/api/customers/${id}/status?status=${status}`, {
      method: 'PATCH',
    });
  },

  /**
   * Клиентская статистика
   */
  async getStats(): Promise<CustomerStats> {
    const response = await apiFetch<Record<string, number>>('/api/customers/stats');
    return {
      totalCustomers: Number(response.totalCustomers ?? 0),
    };
  },

  /**
   * Аналитика поисковых запросов клиентов
   */
  async getSearchAnalytics(): Promise<{ totalQueries: number }> {
    return apiFetch<{ totalQueries: number }>('/api/customers/search-analytics');
  },

  /**
   * История поисков клиентов
   */
  async getSearchHistory(params: { customerId?: number; page?: number; size?: number } = {}): Promise<PageResponse<CustomerSearchHistory>> {
    const queryParams = new URLSearchParams();
    if (params.customerId !== undefined) queryParams.append('customerId', params.customerId.toString());
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());
    const query = queryParams.toString();
    return apiFetch<PageResponse<CustomerSearchHistory>>(`/api/customers/search-history${query ? `?${query}` : ''}`);
  },

  /**
   * Отправить рассылку клиентам
   */
  async sendNewsletter(payload: NewsletterPayload): Promise<NewsletterResponse> {
    return apiFetch<NewsletterResponse>('/api/customers/newsletter', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
