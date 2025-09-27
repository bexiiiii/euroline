import { apiFetch } from '../api';

export interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  newUsersToday: number;
  ordersToday: number;
  revenueToday: number;
}

export interface SalesData {
  date: string;
  sales: number;
  orders: number;
}

export const analyticsApi = {
  getDashboard: async (): Promise<DashboardStats> => {
    return apiFetch<DashboardStats>('/api/analytics/dashboard');
  },

  getSales: async (): Promise<any> => {
    return apiFetch<any>('/api/analytics/sales');
  },

  getCustomers: async (): Promise<any> => {
    return apiFetch<any>('/api/analytics/customers');
  },

  getProducts: async (): Promise<any> => {
    return apiFetch<any>('/api/analytics/products');
  },

  getFinance: async (): Promise<any> => {
    return apiFetch<any>('/api/analytics/finance');
  },
};
