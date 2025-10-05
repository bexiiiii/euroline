"use client";
import React, { useEffect, useState } from "react";
import { analyticsApi } from "@/lib/api/analytics";
import AnalyticsMetrics from "./AnalyticsMetrics";
import RevenueChart from "./RevenueChart";
import OrdersAnalytics from "./OrdersAnalytics";
import TopProductsTable from "./TopProductsTable";
import CustomerGrowthChart from "./CustomerGrowthChart";
import FinanceOverview from "./FinanceOverview";
import CategoryDistribution from "./CategoryDistribution";
import SalesHeatmap from "./SalesHeatmap";

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Аналитика
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Комплексный анализ показателей бизнеса
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <span className="text-gray-500 dark:text-gray-400">—</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Metrics Overview */}
      <AnalyticsMetrics />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <RevenueChart dateRange={dateRange} />
        <OrdersAnalytics />
      </div>

      {/* Finance Overview */}
      <FinanceOverview />

      {/* Second Row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <TopProductsTable />
        </div>
        <CategoryDistribution />
      </div>

      {/* Third Row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <CustomerGrowthChart />
        <SalesHeatmap />
      </div>
    </div>
  );
}
