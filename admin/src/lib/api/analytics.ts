import { apiFetch } from '../api';

export interface DashboardStats {
  orders: number;
  products: number;
  customers: number;
  finance: {
    totalBalance: number;
    monthlyTopUps: number;
    monthlyRefunds: number;
    pendingOperations: number;
    revenue: number;
    topUps: number;
    refunds: number;
  };
}

export interface SalesData {
  date: string;
  sales: number;
  orders: number;
  revenue: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface AnalyticsOverview {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  revenueChart: ChartDataPoint[];
  ordersChart: ChartDataPoint[];
  topProducts: Array<{
    id: number;
    name: string;
    sales: number;
    revenue: number;
  }>;
  customerGrowth: ChartDataPoint[];
  categoryDistribution: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
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

  getTotalUsers: async (): Promise<number> => {
    return apiFetch<number>('/api/admin/analytics/total-users');
  },

  getTotalOrders: async (): Promise<number> => {
    return apiFetch<number>('/api/admin/analytics/total-orders');
  },

  getTotalRevenue: async (): Promise<number> => {
    return apiFetch<number>('/api/admin/analytics/total-revenue');
  },

  getTopProducts: async (): Promise<string[]> => {
    return apiFetch<string[]>('/api/admin/analytics/top-products');
  },

  getRevenueChart: async (from: string, to: string): Promise<ChartDataPoint[]> => {
    return apiFetch<ChartDataPoint[]>(`/api/admin/analytics/revenue-chart?from=${from}&to=${to}`);
  },

  getRevenue: async (from: string, to: string): Promise<number> => {
    return apiFetch<number>(`/api/admin/analytics/revenue?from=${from}&to=${to}`);
  },

  getMonthlySales: async (): Promise<ChartDataPoint[]> => {
    return apiFetch<ChartDataPoint[]>('/api/admin/analytics/monthly-sales');
  },

  getMonthlyRevenue: async (): Promise<ChartDataPoint[]> => {
    return apiFetch<ChartDataPoint[]>('/api/admin/analytics/monthly-revenue');
  },

  getCustomerGrowth: async (): Promise<{ totalCustomers: number; newCustomersThisMonth: number; growth: string }> => {
    return apiFetch('/api/admin/analytics/customer-growth');
  },

  getCustomerGrowthChart: async (): Promise<ChartDataPoint[]> => {
    return apiFetch<ChartDataPoint[]>('/api/admin/analytics/customer-growth-chart');
  },

  getFinanceOverview: async (): Promise<any> => {
    return apiFetch('/api/admin/analytics/finance-overview');
  },

  getTopProductsDetailed: async (limit: number = 10): Promise<any[]> => {
    return apiFetch(`/api/admin/analytics/top-products-detailed?limit=${limit}`);
  },

  getCategoryDistribution: async (): Promise<any[]> => {
    return apiFetch('/api/admin/analytics/category-distribution');
  },

  getSalesHeatmap: async (): Promise<any[]> => {
    return apiFetch('/api/admin/analytics/sales-heatmap');
  },

  getRecentOrders: async (limit: number = 5): Promise<any[]> => {
    return apiFetch(`/api/admin/analytics/recent-orders?limit=${limit}`);
  },

  getMonthlyTarget: async (): Promise<any> => {
    return apiFetch('/api/admin/analytics/monthly-target');
  },

  getCustomerDemographics: async (): Promise<any[]> => {
    return apiFetch('/api/admin/analytics/customer-demographics');
  },
};
