"use client";
import React, { useEffect, useMemo, useState } from "react";
import { ordersApi, OrderSummary } from "@/lib/api/orders";

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

const formatNumber = (value: number) => numberFormatter.format(Math.round(value));

const formatPercent = (value: number) => {
  if (!Number.isFinite(value)) return "0%";
  const rounded = Math.round(value * 10) / 10;
  const sign = rounded > 0 ? "+" : rounded < 0 ? "" : "";
  return `${sign}${rounded.toFixed(1)}%`;
};

const getChangeType = (value: number): ChangeType => {
  if (value > 0) return "increase";
  if (value < 0) return "decrease";
  return "neutral";
};

const asNumber = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const OrdersStats: React.FC = () => {
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const data = await ordersApi.getSummary();
        setSummary(data);
      } catch (err) {
        console.error("Не удалось получить статистику заказов", err);
        setError("Не удалось загрузить статистику заказов");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const stats: StatCard[] = useMemo(() => {
    if (!summary) {
      return [];
    }

    const totalValue = asNumber(summary.total.value);
    const totalChange = asNumber(summary.total.changePercent);
    const newOrdersValue = asNumber(summary.newOrders.value);
    const newOrdersChange = asNumber(summary.newOrders.changePercent);
    const processingValue = asNumber(summary.processing.value);
    const processingDelta = asNumber(summary.processing.delta);
    const completedValue = asNumber(summary.completed.value);
    const completedChange = asNumber(summary.completed.changePercent);

    const baseCards: StatCard[] = [
      {
        title: "Всего заказов",
        value: formatNumber(totalValue),
        changeLabel: `${formatPercent(totalChange)} от прошлого месяца`,
        changeType: getChangeType(totalChange),
        color: "bg-blue-500",
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        ),
      },
      {
        title: "Новые заказы",
        value: formatNumber(newOrdersValue),
        changeLabel: `${formatPercent(newOrdersChange)} от прошлого месяца`,
        changeType: getChangeType(newOrdersChange),
        color: "bg-green-500",
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        ),
      },
      {
        title: "В обработке",
        value: formatNumber(processingValue),
        changeLabel:
          processingDelta === 0
            ? "Без изменений"
            : `${processingDelta > 0 ? "+" : "-"}${formatNumber(Math.abs(processingDelta))} ${processingDelta > 0 ? "новых" : "от прошлого месяца"}`,
        changeType: getChangeType(processingDelta),
        color: "bg-yellow-500",
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      {
        title: "Выполнено",
        value: formatNumber(completedValue),
        changeLabel: `${formatPercent(completedChange)} от прошлого месяца`,
        changeType: getChangeType(completedChange),
        color: "bg-purple-500",
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ),
      },
    ];

    return baseCards;
  }, [summary]);

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

  const getChangeColor = (changeType: "increase" | "decrease" | "neutral") => {
    switch (changeType) {
      case "increase":
        return "text-green-600 dark:text-green-400";
      case "decrease":
        return "text-red-600 dark:text-red-400";
      case "neutral":
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getChangeIcon = (changeType: "increase" | "decrease" | "neutral") => {
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

export default OrdersStats;
