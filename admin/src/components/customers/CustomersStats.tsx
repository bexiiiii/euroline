"use client";
import React, { useEffect, useMemo, useState } from "react";
import { customersApi } from "@/lib/api/customers";

interface CustomersStatsProps {
  refreshKey?: number;
}

interface StatCard {
  title: string;
  value: string;
  subtitle?: string;
  color: string;
  icon: React.ReactNode;
}

const iconWrapper = (path: string) => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
  </svg>
);

const CustomersStats: React.FC<CustomersStatsProps> = ({ refreshKey }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [activeCustomers, setActiveCustomers] = useState(0);
  const [bannedCustomers, setBannedCustomers] = useState(0);
  const [totalQueries, setTotalQueries] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [stats, active, banned, analytics] = await Promise.all([
          customersApi.getStats(),
          customersApi.getCustomers({ status: 'active', size: 1 }),
          customersApi.getCustomers({ status: 'banned', size: 1 }),
          customersApi.getSearchAnalytics().catch(() => ({ totalQueries: 0 })),
        ]);

        if (cancelled) return;

        setTotalCustomers(stats.totalCustomers ?? 0);
        setActiveCustomers(active.totalElements ?? 0);
        setBannedCustomers(banned.totalElements ?? 0);
        setTotalQueries(analytics.totalQueries ?? 0);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Не удалось загрузить статистику');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const stats: StatCard[] = useMemo(() => ([
    {
      title: 'Всего клиентов',
      value: totalCustomers.toLocaleString('ru-RU'),
      subtitle: 'Пользователей в системе',
      color: 'bg-blue-500',
      icon: iconWrapper('M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'),
    },
    {
      title: 'Активные клиенты',
      value: activeCustomers.toLocaleString('ru-RU'),
      subtitle: 'Аккаунты без блокировок',
      color: 'bg-green-500',
      icon: iconWrapper('M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z'),
    },
    {
      title: 'Заблокированные',
      value: bannedCustomers.toLocaleString('ru-RU'),
      subtitle: 'Требуют внимания',
      color: 'bg-yellow-500',
      icon: iconWrapper('M10 9V5a2 2 0 114 0v4m-9 4h14m-7 4h.01'),
    },
    {
      title: 'Поисковых запросов',
      value: totalQueries.toLocaleString('ru-RU'),
      subtitle: 'История поисковой активности',
      color: 'bg-purple-500',
      icon: iconWrapper('M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'),
    },
  ]), [activeCustomers, bannedCustomers, totalCustomers, totalQueries]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-200">
        Не удалось загрузить статистику клиентов: {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 transition-all duration-200 hover:shadow-lg dark:hover:shadow-gray-900/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                {stat.title}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </p>
              {stat.subtitle && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {stat.subtitle}
                </p>
              )}
            </div>
            <div className={`${stat.color} text-white p-3 rounded-lg`}>
              {stat.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CustomersStats;
