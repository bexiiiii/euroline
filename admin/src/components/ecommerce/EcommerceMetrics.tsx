"use client";
import React, { useEffect, useState } from "react";
import Badge from "../ui/badge/Badge";
import { ArrowDownIcon, ArrowUpIcon, BoxIconLine, GroupIcon, DollarLineIcon } from "@/icons";
import { analyticsApi } from "@/lib/api/analytics";

interface DashboardData {
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

export const EcommerceMetrics = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await analyticsApi.getDashboard();
        setData(result);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-xl dark:bg-gray-800"></div>
            <div className="mt-5">
              <div className="h-4 w-20 bg-gray-200 rounded dark:bg-gray-800"></div>
              <div className="h-8 w-24 mt-2 bg-gray-200 rounded dark:bg-gray-800"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* Customers */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl dark:bg-blue-900/20">
          <GroupIcon className="text-blue-600 size-6 dark:text-blue-400" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Клиенты
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {data?.customers.toLocaleString() || 0}
            </h4>
          </div>
          <Badge color="success">
            <ArrowUpIcon />
            Всего
          </Badge>
        </div>
      </div>

      {/* Orders */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl dark:bg-purple-900/20">
          <BoxIconLine className="text-purple-600 dark:text-purple-400" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Заказы
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {data?.orders.toLocaleString() || 0}
            </h4>
          </div>
          <Badge color="primary">
            <ArrowUpIcon />
            Всего
          </Badge>
        </div>
      </div>

      {/* Products */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl dark:bg-green-900/20">
          <BoxIconLine className="text-green-600 dark:text-green-400" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Товары
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {data?.products.toLocaleString() || 0}
            </h4>
          </div>
          <Badge color="success">
            <ArrowUpIcon />
            В наличии
          </Badge>
        </div>
      </div>

      {/* Revenue */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-xl dark:bg-yellow-900/20">
          <DollarLineIcon className="text-yellow-600 dark:text-yellow-400" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Доход
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {data?.finance?.revenue?.toLocaleString() || 0} ₸
            </h4>
          </div>
          <Badge color="warning">
            <ArrowUpIcon />
            Всего
          </Badge>
        </div>
      </div>
    </div>
  );
};
