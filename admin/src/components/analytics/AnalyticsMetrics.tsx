"use client";
import React, { useCallback, useEffect, useState } from "react";
import { analyticsApi, SummaryMetrics } from "@/lib/api/analytics";
import StatCard, { StatGrid } from "@/components/common/StatCard";
import { CartIcon, ChartIcon, UsersIcon, WalletIcon } from "./StatIcons";
import { formatKzt } from "@/lib/format";
import WidgetError from "./WidgetError";

export default function AnalyticsMetrics() {
  const [metrics, setMetrics] = useState<SummaryMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await analyticsApi.getSummaryMetrics();
      setMetrics(summary);
    } catch (err) {
      console.error("Failed to fetch analytics metrics:", err);
      setError("Не удалось загрузить показатели");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  if (loading) {
    return (
      <StatGrid>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[74px] animate-pulse rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]" />
        ))}
      </StatGrid>
    );
  }

  if (error || !metrics) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <WidgetError message="Не удалось загрузить данные" onRetry={fetchMetrics} />
      </div>
    );
  }

  const totalOrders = Number(metrics.totalOrders ?? 0);
  const totalRevenue = Number(metrics.totalRevenue ?? 0);

  return (
    <StatGrid>
      <StatCard
        label="Всего клиентов"
        value={Number(metrics.totalUsers ?? 0).toLocaleString("ru-RU")}
        icon={<UsersIcon />}
      />
      <StatCard label="Всего заказов" value={totalOrders.toLocaleString("ru-RU")} icon={<CartIcon />} />
      <StatCard label="Общая выручка" value={formatKzt(totalRevenue)} icon={<WalletIcon />} />
      <StatCard
        label="Средний чек"
        value={totalOrders > 0 ? formatKzt(Math.round(totalRevenue / totalOrders)) : "—"}
        icon={<ChartIcon />}
      />
    </StatGrid>
  );
}
