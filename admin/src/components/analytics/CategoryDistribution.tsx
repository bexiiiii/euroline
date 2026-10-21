"use client";
import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { analyticsApi } from "@/lib/api/analytics";
import WidgetError from "./WidgetError";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface CategoryData {
  category: string;
  count: number;
  percentage: number;
}

export default function CategoryDistribution() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyticsApi.getCategoryDistribution();
      setCategories(result ?? []);
    } catch (err) {
      console.error("Failed to fetch category distribution:", err);
      setError("Не удалось загрузить категории");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const options: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "Outfit, sans-serif",
    },
    labels: categories.map((c) => c.category),
    colors: ["#465FFF", "#9C27B0", "#00BCD4", "#4CAF50", "#FF9800", "#F44336"],
    legend: {
      show: false,
    },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Всего",
              formatter: () => categories.reduce((sum, c) => sum + c.count, 0).toString(),
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} товаров`,
      },
    },
  };

  const series = categories.map((c) => c.count);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <h3 className="mb-3 text-base font-semibold text-gray-800 dark:text-white/90">
        Товары по категориям
      </h3>

      {loading ? (
        <div className="flex items-center justify-center h-[280px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
        </div>
      ) : error ? (
        <WidgetError message="Не удалось загрузить данные" onRetry={fetchData} className="h-[280px] py-0" />
      ) : categories.length === 0 ? (
        <div className="flex items-center justify-center h-[280px] text-sm text-gray-500 dark:text-gray-400">
          Данных пока нет
        </div>
      ) : (
        <>
          <ReactApexChart options={options} series={series} type="donut" height={240} />

          <div className="mt-3 space-y-2">
            {categories.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="size-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: options.colors?.[index],
                    }}
                  ></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {category.category}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium tabular-nums text-gray-800 dark:text-white/90">
                    {category.count}
                  </span>
                  <span className="w-10 text-right text-xs tabular-nums text-gray-500 dark:text-gray-400">
                    {category.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
