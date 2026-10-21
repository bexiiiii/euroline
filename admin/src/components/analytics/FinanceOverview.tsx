"use client";
import React, { useCallback, useEffect, useState } from "react";
import { analyticsApi, FinanceOverviewSummary } from "@/lib/api/analytics";
import { formatKzt } from "@/lib/format";
import WidgetError from "./WidgetError";
import StatCard, { StatGrid } from "@/components/common/StatCard";
import { ChartIcon, ListIcon, WalletIcon } from "./StatIcons";

const money = (value: number | null | undefined) =>
  value === null || value === undefined ? "—" : formatKzt(value);

export default function FinanceOverview() {
  const [data, setData] = useState<FinanceOverviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyticsApi.getFinanceOverview();
      setData(result);
    } catch (err) {
      console.error("Failed to fetch finance overview:", err);
      setError("Не удалось загрузить финансовую сводку");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const title = (
    <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Финансы за месяц</h3>
  );

  if (loading) {
    return (
      <div>
        {title}
        <StatGrid>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[74px] animate-pulse rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]" />
          ))}
        </StatGrid>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        {title}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <WidgetError message="Не удалось загрузить данные" onRetry={fetchData} />
        </div>
      </div>
    );
  }

  const margin = data.profitMargin;
  const profit = data.monthlyProfit;

  return (
    <div>
      {title}
      <StatGrid>
        <StatCard label="Выручка" value={money(data.monthlyRevenue)} icon={<WalletIcon />} />
        <StatCard label="Расходы" value={money(data.monthlyExpenses)} icon={<ListIcon />} />
        <StatCard
          label="Прибыль"
          value={money(profit)}
          icon={<ChartIcon />}
          tone={typeof profit === "number" && profit < 0 ? "error" : "default"}
        />
        <StatCard
          label="Маржа"
          value={margin === null || margin === undefined ? "—" : `${Number(margin).toFixed(1)}%`}
          icon={<ChartIcon />}
        />
      </StatGrid>
    </div>
  );
}
