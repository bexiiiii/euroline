"use client";
import React, { useCallback, useEffect, useState } from "react";
import StatCard, { StatGrid } from "@/components/common/StatCard";
import { BoxIcon, CartIcon, UsersIcon, WalletIcon } from "@/components/analytics/StatIcons";
import { analyticsApi, DashboardStats } from "@/lib/api/analytics";
import { formatKzt } from "@/lib/format";
import WidgetError from "@/components/analytics/WidgetError";

const formatCount = (value: number | null | undefined) =>
  typeof value === "number" ? value.toLocaleString("ru-RU") : "—";

export const EcommerceMetrics = () => {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyticsApi.getDashboard();
      setData(result);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setError("Не удалось загрузить показатели");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <StatGrid>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[74px] animate-pulse rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]" />
        ))}
      </StatGrid>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <WidgetError message="Не удалось загрузить данные" onRetry={fetchData} />
      </div>
    );
  }

  const revenue = data.finance?.revenue;

  return (
    <StatGrid>
      <StatCard label="Клиенты" value={formatCount(data.customers)} icon={<UsersIcon />} />
      <StatCard label="Заказы" value={formatCount(data.orders)} icon={<CartIcon />} />
      <StatCard label="Товары" value={formatCount(data.products)} icon={<BoxIcon />} />
      <StatCard
        label="Доход"
        value={typeof revenue === "number" ? formatKzt(revenue) : "—"}
        icon={<WalletIcon />}
      />
    </StatGrid>
  );
};
