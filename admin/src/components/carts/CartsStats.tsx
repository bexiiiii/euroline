"use client";
import React, { useState, useEffect } from "react";
import { cartsApi, CartStats } from "@/lib/api/carts";
import { formatKzt } from "@/lib/format";
import StatCard, { StatGrid } from "@/components/common/StatCard";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

interface CartsStatsProps {
  refreshTrigger?: number;
}

const CartsStats: React.FC<CartsStatsProps> = ({ refreshTrigger = 0 }) => {
  const [stats, setStats] = useState<CartStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [refreshTrigger]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setStats(null);
      const data = await cartsApi.getCartStats(30);
      setStats(data);
    } catch (error) {
      console.error("Ошибка при загрузке статистики корзин:", error);
    } finally {
      setLoading(false);
    }
  };

  const show = (v: string) => (loading || !stats ? "—" : v);

  return (
    <div className="space-y-2">
      {!loading && !stats && (
        <p className="text-sm text-error-600 dark:text-error-500">
          Не удалось загрузить данные.{" "}
          <button type="button" onClick={loadStats} className="font-medium underline">
            Повторить
          </button>
        </p>
      )}
      <StatGrid>
        <StatCard
          label="Активные корзины"
          value={show(String(stats?.totalActiveCarts ?? 0))}
          icon={
            <svg {...iconProps}>
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatCard
          label="Брошенные корзины"
          value={show(String(stats?.totalAbandonedCarts ?? 0))}
          icon={
            <svg {...iconProps}>
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Средняя сумма корзины"
          value={show(formatKzt(stats?.averageCartValue ?? 0))}
          icon={
            <svg {...iconProps}>
              <path d="M3 7h18v10H3zM7 12h.01M17 12h.01M12 14a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          }
        />
        <StatCard
          label="Конверсия в заказ"
          value={show(`${(stats?.cartConversionRate ?? 0).toFixed(1)}%`)}
          icon={
            <svg {...iconProps}>
              <path d="M4 20V10M10 20V4M16 20v-6M22 20H2" />
            </svg>
          }
        />
      </StatGrid>
    </div>
  );
};

export default CartsStats;
