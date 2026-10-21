"use client";
import React, { useState, useEffect } from "react";
import { categoriesApi, Category } from "@/lib/api/categories";
import StatCard, { StatGrid } from "@/components/common/StatCard";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

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
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    loadCategories();
  }, [refreshKey]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setFailed(false);
      const tree = await categoriesApi.getCategoryTree();
      const flattened = flattenCategories(tree);
      setCategories(flattened);
    } catch (error) {
      console.error("Не удалось загрузить категории:", error);
      setCategories([]);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  const totalCategories = categories.length;
  const activeCategories = categories.filter((c) => c.isActive).length;
  const subcategories = categories.filter((c) => c.parentId != null).length;
  const rootCategories = categories.filter((c) => !c.parentId).length;
  const totalProducts = categories.reduce((sum, c) => sum + (c.productCount || 0), 0);

  const show = (n: number) => (loading || failed ? "—" : n.toLocaleString("ru-RU"));

  return (
    <div className="space-y-2">
      {failed && (
        <p className="text-sm text-error-600 dark:text-error-500">
          Не удалось загрузить данные.{" "}
          <button type="button" onClick={loadCategories} className="font-medium underline">
            Повторить
          </button>
        </p>
      )}
      <StatGrid>
        <StatCard
          label="Основные категории"
          value={show(rootCategories)}
          icon={
            <svg {...iconProps}>
              <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
          }
        />
        <StatCard
          label="Подкатегории"
          value={show(subcategories)}
          icon={
            <svg {...iconProps}>
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
          }
        />
        <StatCard
          label="Активные"
          value={show(activeCategories)}
          hint={loading || failed ? undefined : `из ${totalCategories}`}
          icon={
            <svg {...iconProps}>
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Товаров в категориях"
          value={show(totalProducts)}
          icon={
            <svg {...iconProps}>
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
      </StatGrid>
    </div>
  );
};

export default CategoriesStats;
