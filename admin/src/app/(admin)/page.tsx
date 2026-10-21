import type { Metadata } from "next";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import React from "react";
import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import RecentOrders from "@/components/ecommerce/RecentOrders";
import DemographicCard from "@/components/ecommerce/DemographicCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export const metadata: Metadata = {
  title: "Статистика",
};

export default function Ecommerce() {
  return (
    <>
      <PageBreadcrumb pageTitle="Статистика" />
      <div className="space-y-4">
        <EcommerceMetrics />

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 xl:col-span-8">
            <MonthlySalesChart />
          </div>
          <div className="col-span-12 xl:col-span-4">
            <MonthlyTarget />
          </div>

          <div className="col-span-12">
            <StatisticsChart />
          </div>

          <div className="col-span-12 xl:col-span-4">
            <DemographicCard />
          </div>
          <div className="col-span-12 xl:col-span-8">
            <RecentOrders />
          </div>
        </div>
      </div>
    </>
  );
}
