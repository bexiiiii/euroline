"use client";
import React, { useState, useEffect } from "react";
import { categoriesApi, Category } from "@/lib/api/categories";

interface CategoriesStatsProps {
  refreshKey: number;
}

const flattenCategories = (items: Category[]): Category[] => {
  const result: Category[] = [];

  const walk = (category: Category) => {
    result.push(category);
    if (category.subcategories && category.subcategories.length > 0) {
      category.subcategories.forEach(walk);
    }
  };

  items.forEach(walk);
  return result;
};

const CategoriesStats: React.FC<CategoriesStatsProps> = ({ refreshKey }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, [refreshKey]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const tree = await categoriesApi.getCategoryTree();
      const flattened = flattenCategories(tree);
      setCategories(flattened);
    } catch (error) {
      console.error("Не удалось загрузить категории:", error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const totalCategories = categories.length;
  const activeCategories = categories.filter((c) => c.isActive).length;
  const subcategories = categories.filter((c) => c.parentId != null).length;
  const rootCategories = categories.filter((c) => !c.parentId).length;
  const totalProducts = categories.reduce((sum, c) => sum + (c.productCount || 0), 0);

  const stats = [
    {
      title: "Всего категорий",
      value: loading ? "—" : totalCategories.toString(),
      change: loading ? "" : `${rootCategories} основных`,
      changeType: "neutral" as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      title: "Активные категории",
      value: loading ? "—" : activeCategories.toString(),
      change: loading ? "" : `${totalCategories ? Math.round((activeCategories / totalCategories) * 100) : 0}%`,
      changeType: "positive" as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Подкатегории",
      value: loading ? "—" : subcategories.toString(),
      change: loading ? "" : `${rootCategories} основных`,
      changeType: "neutral" as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
    },
    {
      title: "Товаров в категориях",
      value: loading ? "—" : totalProducts.toString(),
      change: loading ? "" : `${totalCategories ? Math.round(totalProducts / totalCategories) : 0} среднее`,
      changeType: "positive" as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
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
                    : stat.changeType === "neutral"
                    ? "text-gray-500 dark:text-gray-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {stat.changeType === "positive" && "+"}
                {stat.change}
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {loading ? "" : "за месяц"}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CategoriesStats;
