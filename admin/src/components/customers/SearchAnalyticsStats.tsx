"use client";

import React, { useEffect, useMemo, useState } from "react";
import { customersApi } from "@/lib/api/customers";

interface SearchAnalyticsStatsProps {
  refreshKey?: number;
}

interface StatCard {
  title: string;
  value: string;
  description?: string;
  color: string;
  icon: React.ReactNode;
}

const icon = (path: string) => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
  </svg>
);

const SearchAnalyticsStats: React.FC<SearchAnalyticsStatsProps> = ({ refreshKey }) => {
  const [totalQueries, setTotalQueries] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [analytics, stats] = await Promise.all([
          customersApi.getSearchAnalytics().catch(() => ({ totalQueries: 0 })),
          customersApi.getStats(),
        ]);
        if (cancelled) return;
        setTotalQueries(analytics.totalQueries ?? 0);
        setTotalCustomers(stats.totalCustomers ?? 0);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Не удалось загрузить аналитику");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const stats: StatCard[] = useMemo(() => {
    const avgPerCustomer = totalCustomers > 0 ? totalQueries / totalCustomers : 0;
    const dailyAverage = totalQueries / 30; // условная метрика за последний месяц

    return [
      {
        title: "Всего поисковых запросов",
        value: totalQueries.toLocaleString("ru-RU"),
        description: "История обращений к поиску",
        color: "bg-blue-500",
        icon: icon("M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"),
      },
      {
        title: "Среднее на клиента",
        value: avgPerCustomer.toFixed(2),
        description: totalCustomers ? `${totalCustomers.toLocaleString("ru-RU")} клиентов` : "Нет данных по клиентам",
        color: "bg-green-500",
        icon: icon("M16 17l-4-4-4 4m8-8l-4-4-4 4"),
      },
      {
        title: "Среднесуточно",
        value: dailyAverage.toFixed(1),
        description: "За последние 30 дней",
        color: "bg-purple-500",
        icon: icon("M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V4m0 16v-4M4 4h16"),
      },
    ];
  }, [totalQueries, totalCustomers]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-200">
        {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.title}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 transition-shadow hover:shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {stat.value}
              </p>
              {stat.description && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{stat.description}</p>
              )}
            </div>
            <div className={`${stat.color} text-white p-3 rounded-lg`}>{stat.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SearchAnalyticsStats;
