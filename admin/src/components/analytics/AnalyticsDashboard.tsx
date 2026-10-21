"use client";
import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import AnalyticsMetrics from "./AnalyticsMetrics";
import RevenueChart from "./RevenueChart";
import OrdersAnalytics from "./OrdersAnalytics";
import TopProductsTable from "./TopProductsTable";
import CustomerGrowthChart from "./CustomerGrowthChart";
import FinanceOverview from "./FinanceOverview";
import CategoryDistribution from "./CategoryDistribution";
import SalesHeatmap from "./SalesHeatmap";

export default function AnalyticsDashboard() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Аналитика" />

      <div className="space-y-4">
        <AnalyticsMetrics />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <RevenueChart />
          <OrdersAnalytics />
        </div>

        <FinanceOverview />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <TopProductsTable />
          </div>
          <CategoryDistribution />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <CustomerGrowthChart />
          <SalesHeatmap />
        </div>
      </div>
    </div>
  );
}
