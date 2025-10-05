"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { analyticsApi } from "@/lib/api/analytics";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface CategoryData {
  category: string;
  count: number;
  percentage: number;
}

export default function CategoryDistribution() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await analyticsApi.getCategoryDistribution();
        setCategories(result);
      } catch (error) {
        console.error("Failed to fetch category distribution:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const options: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "Outfit, sans-serif",
    },
    labels: categories.map((c) => c.category),
    colors: ["#465FFF", "#9C27B0", "#00BCD4", "#4CAF50", "#FF9800", "#F44336"],
    legend: {
      show: true,
      position: "bottom",
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
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Распределение по категориям
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Товары по категориям
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[350px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <ReactApexChart options={options} series={series} type="donut" height={280} />
          
          <div className="mt-6 space-y-3">
            {categories.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: options.colors?.[index],
                    }}
                  ></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {category.category}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {category.count}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-500">
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
