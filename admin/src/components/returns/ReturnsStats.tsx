"use client";
import React, { useEffect, useMemo, useState } from "react";
import { returnsApi, ReturnSummary } from "@/lib/api/returns";

type ChangeType = "increase" | "decrease" | "neutral";

interface StatCard {
  title: string;
  value: string;
  changeLabel: string;
  changeType: ChangeType;
  icon: React.ReactNode;
  color: string;
}

const numberFormatter = new Intl.NumberFormat("ru-RU");
const currencyFormatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "KZT",
  maximumFractionDigits: 0,
});

const formatNumber = (value: number) => numberFormatter.format(Math.round(value));
const formatCurrency = (value: number) => currencyFormatter.format(Math.round(value));
const formatPercent = (value: number) => {
  if (!Number.isFinite(value)) return "0%";
  const rounded = Math.round(value * 10) / 10;
  const sign = rounded > 0 ? "+" : rounded < 0 ? "" : "";
  return `${sign}${rounded.toFixed(1)}%`;
};
const formatPercentValue = (value: number) => {
  if (!Number.isFinite(value)) return "0%";
  const rounded = Math.round(value * 10) / 10;
  return `${rounded.toFixed(1)}%`;
};
const asNumber = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const getChangeType = (value: number): ChangeType => {
  if (value > 0) return "increase";
  if (value < 0) return "decrease";
  return "neutral";
};

const ReturnsStats: React.FC<{ refreshToken?: string }> = ({ refreshToken }) => {
  const [summary, setSummary] = useState<ReturnSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const data = await returnsApi.getStats();
        if (!active) return;
        setSummary(data);
        setError(null);
      } catch (err) {
        console.error("Не удалось получить статистику возвратов", err);
        if (!active) return;
        setError("Не удалось загрузить статистику возвратов");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchSummary();
    return () => {
      active = false;
    };
  }, [refreshToken]);

  const stats = useMemo<StatCard[]>(() => {
    if (!summary) return [];

    const totalValue = asNumber(summary.total.value);
    const totalChange = asNumber(summary.total.changePercent);

    const processingValue = asNumber(summary.processing.value);
    const processingDelta = asNumber(summary.processing.delta);

    const amountCurrent = asNumber(summary.amount.current);
    const amountChange = asNumber(summary.amount.changePercent);

    const returnRateValue = asNumber(summary.returnRate.value);
    const returnRateChange = asNumber(summary.returnRate.change);

    return [
      {
        title: "Всего возвратов",
        value: formatNumber(totalValue),
        changeLabel: `${formatPercent(totalChange)} от прошлого месяца`,
        changeType: getChangeType(totalChange),
        color: "bg-yellow-500",
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m5 14v-5a2 2 0 00-2-2H6a2 2 0 00-2 2v5a2 2 0 002 2h14a2 2 0 002-2z" />
          </svg>
        ),
      },
      {
        title: "В обработке",
        value: formatNumber(processingValue),
        changeLabel:
          processingDelta === 0
            ? "Без изменений"
            : `${processingDelta > 0 ? "+" : ""}${formatNumber(Math.abs(processingDelta))} новых`,
        changeType: getChangeType(processingDelta),
        color: "bg-orange-500",
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      {
        title: "Сумма возвратов",
        value: formatCurrency(amountCurrent),
        changeLabel: `${formatPercent(amountChange)} от прошлого месяца`,
        changeType: getChangeType(amountChange),
        color: "bg-red-500",
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      {
        title: "Процент возвратов",
        value: formatPercentValue(returnRateValue),
        changeLabel: `${formatPercent(returnRateChange)} к прошлому периоду`,
        changeType: getChangeType(returnRateChange),
        color: "bg-blue-500",
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
      },
    ];
  }, [summary]);

  const getChangeColor = (changeType: ChangeType) => {
    switch (changeType) {
      case "increase":
        return "text-green-600 dark:text-green-400";
      case "decrease":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getChangeIcon = (changeType: ChangeType) => {
    if (changeType === "increase") {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
        </svg>
      );
    }
    if (changeType === "decrease") {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
        </svg>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[0, 1, 2, 3].map((key) => (
          <div
            key={key}
            className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <div className="animate-pulse space-y-4">
              <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-7 w-32 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-300">
        {error}
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
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {stat.value}
              </p>
              <div className={`flex items-center gap-1 text-sm ${getChangeColor(stat.changeType)}`}>
                {getChangeIcon(stat.changeType)}
                <span className="font-medium">{stat.changeLabel}</span>
              </div>
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

export default ReturnsStats;
