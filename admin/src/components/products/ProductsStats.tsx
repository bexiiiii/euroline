"use client";
import React, { useState, useEffect } from "react";
import { productApi, Product } from "@/lib/api/products";

interface ProductsStatsProps {
  refreshKey: number;
}

"use client";
import React, { useState, useEffect } from "react";
import { productApi } from "@/lib/api/products";

interface ProductsStatsProps {
  refreshKey: number;
}

const ProductsStats: React.FC<ProductsStatsProps> = ({ refreshKey }) => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    inStock: 0,
    outOfStock: 0,
    syncedWith1C: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [refreshKey]);

  const loadStats = async () => {
    try {
      setLoading(true);
      // 🚀 Используем быстрый endpoint со SQL-агрегацией
      const data = await productApi.getStats();
      setStats(data);
    } catch (error) {
      console.error("Не удалось загрузить статистику:", error);
    } finally {
      setLoading(false);
    }
  };

  const statsConfig = [
    {
      title: "Всего товаров",
      value: loading ? "—" : stats.totalProducts.toString(),
      change: "+12%", // TODO: вычислить реальное изменение
      changeType: "positive" as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      title: "В наличии",
      value: loading ? "—" : stats.inStock.toString(),
      change: "+8%", // TODO: вычислить реальное изменение
      changeType: "positive" as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Нет в наличии",
      value: loading ? "—" : stats.outOfStock.toString(),
      change: "-3%", // TODO: вычислить реальное изменение
      changeType: "negative" as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
    },
    {
      title: "Из 1С",
      value: loading ? "—" : stats.syncedWith1C.toString(),
      change: "+15%", // TODO: вычислить реальное изменение
      changeType: "positive" as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statsConfig.map((stat, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-50 dark:bg-brand-500/10 rounded-lg text-brand-500 dark:text-brand-400">
                {stat.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span
                className={`text-sm font-medium ${
                  stat.changeType === "positive"
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {stat.change}
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                от прошлого месяца
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductsStats;
