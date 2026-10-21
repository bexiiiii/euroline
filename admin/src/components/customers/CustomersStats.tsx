"use client";
import React, { useEffect, useState } from "react";
import { customersApi } from "@/lib/api/customers";
import StatCard, { StatGrid } from "@/components/common/StatCard";

interface CustomersStatsProps {
  refreshKey?: number;
}

const icon = (path: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
);

const CustomersStats: React.FC<CustomersStatsProps> = ({ refreshKey }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [activeCustomers, setActiveCustomers] = useState(0);
  const [bannedCustomers, setBannedCustomers] = useState(0);
  const [totalQueries, setTotalQueries] = useState(0);
  const [retryKey, setRetryKey] = useState(0);

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
  }, [refreshKey, retryKey]);

  const show = (n: number) => (loading || error ? "—" : n.toLocaleString("ru-RU"));

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-sm text-error-600 dark:text-error-500">
          Не удалось загрузить данные.{" "}
          <button type="button" onClick={() => setRetryKey((k) => k + 1)} className="font-medium underline">
            Повторить
          </button>
        </p>
      )}
      <StatGrid>
        <StatCard
          label="Всего клиентов"
          value={show(totalCustomers)}
          icon={icon("M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z")}
        />
        <StatCard
          label="Активные"
          value={show(activeCustomers)}
          icon={icon("M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z")}
        />
        <StatCard
          label="Заблокированные"
          value={show(bannedCustomers)}
          tone={!loading && !error && bannedCustomers > 0 ? "warning" : "default"}
          icon={icon("M18.364 5.636l-12.728 12.728M21 12a9 9 0 11-18 0 9 9 0 0118 0z")}
        />
        <StatCard
          label="Поисковых запросов"
          value={show(totalQueries)}
          icon={icon("M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z")}
        />
      </StatGrid>
    </div>
  );
};

export default CustomersStats;
