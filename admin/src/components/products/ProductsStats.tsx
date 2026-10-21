"use client";
import React, { useState, useEffect } from "react";
import { productApi } from "@/lib/api/products";
import StatCard, { StatGrid } from "@/components/common/StatCard";

interface ProductsStatsProps {
  refreshKey: number;
}

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ProductsStats: React.FC<ProductsStatsProps> = ({ refreshKey }) => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    inStock: 0,
    outOfStock: 0,
    syncedWith1C: 0,
  });
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    loadStats();
  }, [refreshKey]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setFailed(false);
      const data = await productApi.getStats();
      setStats(data);
    } catch (error) {
      console.error("Не удалось загрузить статистику:", error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  const show = (n: number) => (loading || failed ? "—" : n.toLocaleString("ru-RU"));

  return (
    <div className="space-y-2">
      {failed && (
        <p className="text-sm text-error-600 dark:text-error-500">
          Не удалось загрузить данные.{" "}
          <button type="button" onClick={loadStats} className="font-medium underline">
            Повторить
          </button>
        </p>
      )}
      <StatGrid>
        <StatCard
          label="Всего товаров"
          value={show(stats.totalProducts)}
          icon={
            <svg {...iconProps}>
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
        <StatCard
          label="В наличии"
          value={show(stats.inStock)}
          icon={
            <svg {...iconProps}>
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Нет в наличии"
          value={show(stats.outOfStock)}
          tone={!loading && !failed && stats.outOfStock > 0 ? "warning" : "default"}
          icon={
            <svg {...iconProps}>
              <path d="M12 9v4m0 4h.01M10.3 3.9L2.4 17.5A2 2 0 004.1 20.5h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
            </svg>
          }
        />
        <StatCard
          label="Из 1С"
          value={show(stats.syncedWith1C)}
          icon={
            <svg {...iconProps}>
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
        />
      </StatGrid>
    </div>
  );
};

export default ProductsStats;
