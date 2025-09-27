"use client";
import React, { useState, useEffect } from "react";
import { financeApi } from "@/lib/api/finance";

const FinanceStats: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<{
    totalBalance: number;
    monthlyTopUps: number;
    monthlyRefunds: number;
    pendingOperations: number;
  } | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      const statsResponse = await financeApi.getStats();

      setStatsData({
        totalBalance: Number(statsResponse.totalBalance ?? statsResponse.revenue ?? 0),
        monthlyTopUps: Number(statsResponse.monthlyTopUps ?? 0),
        monthlyRefunds: Number(statsResponse.monthlyRefunds ?? 0),
        pendingOperations: Number(statsResponse.pendingOperations ?? 0),
      });
    } catch (error) {
      console.error("Не удалось загрузить финансовую статистику:", error);
      setStatsData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount?: number | null) => {
    if (amount === undefined || amount === null || Number.isNaN(amount)) return "—";
    return new Intl.NumberFormat("kk-KZ", {
      style: "currency",
      currency: "KZT",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (value?: number | null) => {
    if (value === undefined || value === null || Number.isNaN(value)) return "—";
    return new Intl.NumberFormat("ru-RU", {
      maximumFractionDigits: 0,
    }).format(value);
  };

  const stats = [
    {
      title: "Общий баланс",
      value: loading ? "—" : formatCurrency(statsData?.totalBalance),
      change: "за всё время",
      changeType: "increase" as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      bgColor: "bg-blue-500",
    },
    {
      title: "Пополнения за месяц",
      value: loading ? "—" : formatCurrency(statsData?.monthlyTopUps),
      change: "за текущий месяц",
      changeType: "increase" as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
      ),
      bgColor: "bg-green-500",
    },
    {
      title: "Возвраты за месяц",
      value: loading ? "—" : formatCurrency(statsData?.monthlyRefunds),
      change: "за текущий месяц",
      changeType: "decrease" as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
        </svg>
      ),
      bgColor: "bg-red-500",
    },
    {
      title: "Ожидают обработки",
      value: loading ? "—" : formatNumber(statsData?.pendingOperations ?? 0),
      change: loading ? "—" : "операций",
      changeType: "increase" as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: "bg-yellow-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                {stat.title}
              </p>
              <div className="flex items-baseline space-x-1">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? "—" : stat.value}
              </p>
              </div>
              <div className="flex items-center mt-2">
                <span
                  className={`text-sm font-medium ${
                    stat.changeType === "increase"
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                  {stat.title === "Ожидают обработки" ? "" : "за месяц"}
                </span>
              </div>
            </div>
            <div className={`${stat.bgColor} p-3 rounded-lg text-white`}>
              {stat.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FinanceStats;
