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

export interface FinanceOverviewSummary {
  totalRevenue: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyProfit: number;
  averageOrderValue: number;
  totalOrders: number;
  profitMargin: number;
}

export interface TopProductDetail {
  id: number;
  name: string;
  category: string;
  sales: number;
  revenue: number;
  stock?: number;
  trend?: string;
}

export interface CategoryDistributionItem {
  category: string;
  count: number;
  percentage: number;
}

export interface HeatmapDataPoint {
  day: string;
  hour: number;
  sales: number;
}

export interface MonthlyTargetSummary {
  target: number;
  currentRevenue: number;
  todayRevenue: number;
  progressPercent: number;
  growthPercent?: number;
  isGrowthPositive?: boolean;
}

export interface CustomerDemographic {
  country: string;
  customers?: number;
  visitors?: number;
  percentage: number;
}

export interface RecentOrderItemSummary {
  productName: string;
  quantity: number;
  price: number;
  category: string;
}

export interface RecentOrderSummary {
  id: number;
  publicCode: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  customerEmail: string;
  items: RecentOrderItemSummary[];
}

export const analyticsApi = {
  getDashboard: async (): Promise<DashboardStats> => {
    return apiFetch<DashboardStats>('/api/analytics/dashboard');
  },

  getSales: async (): Promise<Record<string, unknown>> => {
    return apiFetch<Record<string, unknown>>('/api/analytics/sales');
  },

  getCustomers: async (): Promise<Record<string, unknown>> => {
    return apiFetch<Record<string, unknown>>('/api/analytics/customers');
  },

  getProducts: async (): Promise<Record<string, unknown>> => {
    return apiFetch<Record<string, unknown>>('/api/analytics/products');
  },

  getFinance: async (): Promise<Record<string, unknown>> => {
    return apiFetch<Record<string, unknown>>('/api/analytics/finance');
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

  getCustomerGrowth: async (): Promise<{
    totalCustomers: number;
    newCustomersThisMonth: number;
    growth: string;
  }> => {
    return apiFetch('/api/admin/analytics/customer-growth');
  },

  getCustomerGrowthChart: async (): Promise<ChartDataPoint[]> => {
    return apiFetch<ChartDataPoint[]>('/api/admin/analytics/customer-growth-chart');
  },

  getFinanceOverview: async (): Promise<FinanceOverviewSummary> => {
    return apiFetch<FinanceOverviewSummary>('/api/admin/analytics/finance-overview');
  },

  getTopProductsDetailed: async (limit = 10): Promise<TopProductDetail[]> => {
    return apiFetch<TopProductDetail[]>(`/api/admin/analytics/top-products-detailed?limit=${limit}`);
  },

  getCategoryDistribution: async (): Promise<CategoryDistributionItem[]> => {
    return apiFetch<CategoryDistributionItem[]>('/api/admin/analytics/category-distribution');
  },

  getSalesHeatmap: async (): Promise<HeatmapDataPoint[]> => {
    return apiFetch<HeatmapDataPoint[]>('/api/admin/analytics/sales-heatmap');
  },

  getRecentOrders: async (limit = 5): Promise<RecentOrderSummary[]> => {
    return apiFetch<RecentOrderSummary[]>(`/api/admin/analytics/recent-orders?limit=${limit}`);
  },

  getMonthlyTarget: async (): Promise<MonthlyTargetSummary> => {
    return apiFetch<MonthlyTargetSummary>('/api/admin/analytics/monthly-target');
  },

  getCustomerDemographics: async (): Promise<CustomerDemographic[]> => {
    return apiFetch<CustomerDemographic[]>('/api/admin/analytics/customer-demographics');
  },
};
