"use client";
import React, { useEffect, useState } from "react";
import { analyticsApi, SummaryMetrics } from "@/lib/api/analytics";
import { ArrowUpIcon, ArrowDownIcon, GroupIcon, BoxIconLine, DollarLineIcon } from "@/icons";

export default function AnalyticsMetrics() {
  const [metrics, setMetrics] = useState<SummaryMetrics>({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const summary = await analyticsApi.getSummaryMetrics();
        setMetrics(summary);
      } catch (error) {
        console.error("Failed to fetch analytics metrics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
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

  const metricsData = [
    {
      title: "Всего клиентов",
      value: metrics.totalUsers.toLocaleString(),
      icon: <GroupIcon className="size-6" />,
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      trend: { value: "+12.5%", isPositive: true },
      subtitle: "За всё время"
    },
    {
      title: "Всего заказов",
      value: metrics.totalOrders.toLocaleString(),
      icon: <BoxIconLine className="size-6" />,
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
      iconColor: "text-purple-600 dark:text-purple-400",
      trend: { value: "+8.3%", isPositive: true },
      subtitle: "За всё время"
    },
    {
      title: "Общая выручка",
      value: `${metrics.totalRevenue.toLocaleString()} ₸`,
      icon: <DollarLineIcon className="size-6" />,
      bgColor: "bg-green-100 dark:bg-green-900/20",
      iconColor: "text-green-600 dark:text-green-400",
      trend: { value: "+23.1%", isPositive: true },
      subtitle: "За всё время"
    },
    {
      title: "Средний чек",
      value: metrics.totalOrders > 0 
        ? `${Math.round(metrics.totalRevenue / metrics.totalOrders).toLocaleString()} ₸`
        : "0 ₸",
      icon: <DollarLineIcon className="size-6" />,
      bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
      iconColor: "text-yellow-600 dark:text-yellow-400",
      trend: { value: "+5.7%", isPositive: true },
      subtitle: "На заказ"
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      {metricsData.map((metric, index) => (
        <div
          key={index}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 hover:shadow-lg transition-shadow"
        >
          <div className={`flex items-center justify-center w-12 h-12 ${metric.bgColor} rounded-xl`}>
            <div className={metric.iconColor}>{metric.icon}</div>
          </div>
          <div className="mt-5">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {metric.title}
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-2xl dark:text-white/90">
              {metric.value}
            </h4>
            <div className="flex items-center gap-2 mt-3">
              <span className={`flex items-center gap-1 text-xs font-medium ${
                metric.trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {metric.trend.isPositive ? <ArrowUpIcon className="size-3" /> : <ArrowDownIcon className="size-3" />}
                {metric.trend.value}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {metric.subtitle}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
