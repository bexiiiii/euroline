"use client";
import React, { useEffect, useState } from "react";
import { analyticsApi } from "@/lib/api/analytics";
import { ArrowUpIcon, ArrowDownIcon } from "@/icons";

interface FinanceOverviewData {
  totalRevenue: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyProfit: number;
  averageOrderValue: number;
  totalOrders: number;
  profitMargin: number;
}

export default function FinanceOverview() {
  const [data, setData] = useState<FinanceOverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await analyticsApi.getFinanceOverview();
        setData(result);
      } catch (error) {
        console.error("Failed to fetch finance overview:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded dark:bg-gray-800 mb-6"></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded dark:bg-gray-800"></div>
              <div className="h-8 w-32 bg-gray-200 rounded dark:bg-gray-800"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const financeData = [
    {
      label: "Выручка за месяц",
      value: `${data?.monthlyRevenue?.toLocaleString() || 0} ₸`,
      change: "+15.3%",
      isPositive: true,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Расходы за месяц",
      value: `${data?.monthlyExpenses?.toLocaleString() || 0} ₸`,
      change: "+8.7%",
      isPositive: false,
      color: "text-red-600 dark:text-red-400",
    },
    {
      label: "Прибыль за месяц",
      value: `${data?.monthlyProfit?.toLocaleString() || 0} ₸`,
      change: "+12.5%",
      isPositive: true,
      color: "text-green-600 dark:text-green-400",
    },
    {
      label: "Маржа прибыли",
      value: `${data?.profitMargin?.toFixed(1) || 0}%`,
      change: `${data?.profitMargin?.toFixed(1) || 0}%`,
      isPositive: true,
      color: "text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Финансовая сводка
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Обзор финансовых показателей
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {financeData.map((item, index) => (
          <div key={index} className="space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
            <div className="flex items-end gap-3">
              <h4 className={`text-2xl font-bold ${item.color}`}>{item.value}</h4>
            </div>
            <div className="flex items-center gap-1">
              {item.isPositive ? (
                <ArrowUpIcon className="size-4 text-green-500" />
              ) : (
                <ArrowDownIcon className="size-4 text-red-500" />
              )}
              <span className={`text-xs font-medium ${
                item.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {item.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-900/10">
          <p className="text-sm text-gray-600 dark:text-gray-400">Общая выручка</p>
          <p className="mt-2 text-xl font-bold text-blue-600 dark:text-blue-400">
            {data?.totalRevenue?.toLocaleString() || 0} ₸
          </p>
        </div>
        <div className="rounded-xl bg-purple-50 p-4 dark:bg-purple-900/10">
          <p className="text-sm text-gray-600 dark:text-gray-400">Всего заказов</p>
          <p className="mt-2 text-xl font-bold text-purple-600 dark:text-purple-400">
            {data?.totalOrders || 0}
          </p>
        </div>
        <div className="rounded-xl bg-green-50 p-4 dark:bg-green-900/10">
          <p className="text-sm text-gray-600 dark:text-gray-400">Средний чек</p>
          <p className="mt-2 text-xl font-bold text-green-600 dark:text-green-400">
            {data?.averageOrderValue?.toLocaleString() || 0} ₸
          </p>
        </div>
      </div>
    </div>
  );
}
