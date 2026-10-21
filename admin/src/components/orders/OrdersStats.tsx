"use client";
import React, { useEffect, useState } from "react";
import { ordersApi, OrderSummary } from "@/lib/api/orders";
import StatCard, { StatGrid } from "@/components/common/StatCard";

const numberFormatter = new Intl.NumberFormat("ru-RU");

const formatNumber = (value: number) => numberFormatter.format(Math.round(value));

const asNumber = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

/** Изменение к прошлому месяцу, только если API его вернул. */
const percentHint = (value: unknown): string | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  const n = asNumber(value);
  const rounded = Math.round(n * 10) / 10;
  if (rounded === 0) return undefined;
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded.toFixed(1)}% к прошлому месяцу`;
};

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const OrdersStats: React.FC = () => {
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [failed, setFailed] = useState(false);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setFailed(false);
      const data = await ordersApi.getSummary();
      setSummary(data);
    } catch (err) {
      console.error("Не удалось получить статистику заказов", err);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const ready = !loading && !failed && summary;
  const value = (v: unknown) => (ready ? formatNumber(asNumber(v)) : "—");

  return (
    <div className="space-y-2">
      {failed && (
        <p className="text-sm text-error-600 dark:text-error-500">
          Не удалось загрузить данные.{" "}
          <button type="button" onClick={fetchSummary} className="font-medium underline">
            Повторить
          </button>
        </p>
      )}
      <StatGrid>
        <StatCard
          label="Всего заказов"
          value={value(summary?.total.value)}
          hint={ready ? percentHint(summary?.total.changePercent) : undefined}
          icon={
            <svg {...iconProps}>
              <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          }
        />
        <StatCard
          label="Новые"
          value={value(summary?.newOrders.value)}
          hint={ready ? percentHint(summary?.newOrders.changePercent) : undefined}
          icon={
            <svg {...iconProps}>
              <path d="M12 5v14m7-7H5" />
            </svg>
          }
        />
        <StatCard
          label="В обработке"
          value={value(summary?.processing.value)}
          icon={
            <svg {...iconProps}>
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Выполнено"
          value={value(summary?.completed.value)}
          hint={ready ? percentHint(summary?.completed.changePercent) : undefined}
          icon={
            <svg {...iconProps}>
              <path d="M5 13l4 4L19 7" />
            </svg>
          }
        />
      </StatGrid>
    </div>
  );
};

export default OrdersStats;
