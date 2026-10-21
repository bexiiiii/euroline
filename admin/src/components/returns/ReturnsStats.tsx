"use client";
import React, { useEffect, useState } from "react";
import { returnsApi, ReturnSummary } from "@/lib/api/returns";
import { formatKzt } from "@/lib/format";
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
  const rounded = Math.round(asNumber(value) * 10) / 10;
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

const ReturnsStats: React.FC<{ refreshToken?: string }> = ({ refreshToken }) => {
  const [summary, setSummary] = useState<ReturnSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [failed, setFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const data = await returnsApi.getStats();
        if (!active) return;
        setSummary(data);
        setFailed(false);
      } catch (err) {
        console.error("Не удалось получить статистику возвратов", err);
        if (!active) return;
        setFailed(true);
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
  }, [refreshToken, retryKey]);

  const ready = !loading && !failed && !!summary;

  return (
    <div className="space-y-2">
      {failed && (
        <p className="text-sm text-error-600 dark:text-error-500">
          Не удалось загрузить данные.{" "}
          <button type="button" onClick={() => setRetryKey((k) => k + 1)} className="font-medium underline">
            Повторить
          </button>
        </p>
      )}
      <StatGrid>
        <StatCard
          label="Всего возвратов"
          value={ready ? formatNumber(asNumber(summary?.total.value)) : "—"}
          hint={ready ? percentHint(summary?.total.changePercent) : undefined}
          icon={
            <svg {...iconProps}>
              <path d="M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 010 11H11" />
            </svg>
          }
        />
        <StatCard
          label="В обработке"
          value={ready ? formatNumber(asNumber(summary?.processing.value)) : "—"}
          icon={
            <svg {...iconProps}>
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Сумма возвратов"
          value={ready ? formatKzt(asNumber(summary?.amount.current)) : "—"}
          hint={ready ? percentHint(summary?.amount.changePercent) : undefined}
          icon={
            <svg {...iconProps}>
              <path d="M3 7h18v10H3zM7 12h.01M17 12h.01M12 14a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          }
        />
        <StatCard
          label="Доля возвратов"
          value={ready ? `${(Math.round(asNumber(summary?.returnRate.value) * 10) / 10).toFixed(1)}%` : "—"}
          icon={
            <svg {...iconProps}>
              <path d="M19 5L5 19M6.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM17.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
            </svg>
          }
        />
      </StatGrid>
    </div>
  );
};

export default ReturnsStats;
