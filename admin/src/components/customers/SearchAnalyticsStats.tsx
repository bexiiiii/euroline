"use client";

import React, { useEffect, useState } from "react";
import { customersApi } from "@/lib/api/customers";
import StatCard, { StatGrid } from "@/components/common/StatCard";

interface SearchAnalyticsStatsProps {
  refreshKey?: number;
}

const icon = (path: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
);

const SearchAnalyticsStats: React.FC<SearchAnalyticsStatsProps> = ({ refreshKey }) => {
  const [totalQueries, setTotalQueries] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [retryKey, setRetryKey] = useState(0);
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
  }, [refreshKey, retryKey]);

  const ready = !loading && !error;
  const avgPerCustomer = totalCustomers > 0 ? totalQueries / totalCustomers : 0;

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
          label="Поисковых запросов"
          value={ready ? totalQueries.toLocaleString("ru-RU") : "—"}
          icon={icon("M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z")}
        />
        <StatCard
          label="В среднем на клиента"
          value={ready ? avgPerCustomer.toLocaleString("ru-RU", { maximumFractionDigits: 1 }) : "—"}
          hint={ready && totalCustomers ? `${totalCustomers.toLocaleString("ru-RU")} клиентов` : undefined}
          icon={icon("M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z")}
        />
      </StatGrid>
    </div>
  );
};

export default SearchAnalyticsStats;
