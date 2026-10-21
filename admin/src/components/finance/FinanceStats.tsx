"use client";
import React, { useState, useEffect } from "react";
import { financeApi } from "@/lib/api/finance";
import { formatKzt } from "@/lib/format";
import FinanceLoadError from "./FinanceLoadError";
import StatCard, { StatGrid } from "@/components/common/StatCard";

interface FinanceStatsProps {
  /** Изменение значения перезагружает статистику. */
  refreshKey?: number;
}

const FinanceStats: React.FC<FinanceStatsProps> = ({ refreshKey = 0 }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statsData, setStatsData] = useState<{
    totalBalance: number;
    monthlyTopUps: number;
    monthlyRefunds: number;
    pendingOperations: number;
  } | null>(null);

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

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
      setError("Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount?: number | null) => {
    if (amount === undefined || amount === null || Number.isNaN(amount)) return "—";
    return formatKzt(amount);
  };

  const formatNumber = (value?: number | null) => {
    if (value === undefined || value === null || Number.isNaN(value)) return "—";
    return new Intl.NumberFormat("ru-RU", {
      maximumFractionDigits: 0,
    }).format(value);
  };

  const show = (value: string) => (loading ? "—" : value);

  if (error) {
    return <FinanceLoadError message={error} onRetry={loadStats} />;
  }

  return (
    <StatGrid>
      <StatCard
        label="Общий баланс"
        value={show(formatCurrency(statsData?.totalBalance))}
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="6" width="18" height="13" rx="2" />
            <path d="M3 10h18M16 15h2" />
          </svg>
        }
      />
      <StatCard
        label="Пополнения за месяц"
        value={show(formatCurrency(statsData?.monthlyTopUps))}
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M6 11l6-6 6 6" />
          </svg>
        }
      />
      <StatCard
        label="Возвраты за месяц"
        value={show(formatCurrency(statsData?.monthlyRefunds))}
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M6 13l6 6 6-6" />
          </svg>
        }
      />
      <StatCard
        label="Ожидают обработки"
        value={show(formatNumber(statsData?.pendingOperations))}
        tone={!loading && (statsData?.pendingOperations ?? 0) > 0 ? "warning" : "default"}
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" />
          </svg>
        }
      />
    </StatGrid>
  );
};

export default FinanceStats;
