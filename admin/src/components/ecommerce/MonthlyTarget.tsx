"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ApexOptions } from "apexcharts";
import { analyticsApi, MonthlyTargetSummary } from "@/lib/api/analytics";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function MonthlyTarget() {
  const [targetData, setTargetData] = useState<MonthlyTargetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTargetData = async () => {
      try {
        const data = await analyticsApi.getMonthlyTarget();
        setTargetData(data);
        setError(null);
      } catch (error) {
        console.error("Failed to fetch monthly target:", error);
        setError("Не удалось загрузить данные");
        // Set fallback data
        setTargetData({
          target: 5000000,
          currentRevenue: 0,
          todayRevenue: 0,
          progressPercent: 0,
          growthPercent: 0,
          isGrowthPositive: true
        });
      } finally {
        setLoading(false);
      }
    };
    fetchTargetData();
  }, []);

  const options: ApexOptions = {
    chart: {
      height: 350,
      type: "radialBar",
    },
    plotOptions: {
      radialBar: {
        hollow: {
          size: "65%",
        },
        dataLabels: {
          name: {
            fontSize: "14px",
            color: "#6B7280",
            fontWeight: 500,
          },
          value: {
            fontSize: "28px",
            fontWeight: 600,
            color: "#111827",
            formatter: function (val: number) {
              return Math.round(val) + "%";
            },
          },
        },
      },
    },
    fill: {
      colors: ["#3b82f6"],
    },
    labels: ["Цель"],
  };

  const series = targetData ? [Math.round(targetData.progressPercent)] : [0];

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="animate-pulse">
          <div className="h-6 w-32 bg-gray-200 rounded dark:bg-gray-800 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded dark:bg-gray-800"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Месячная цель
          </h3>
        </div>
        <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Месячная цель
        </h3>
      </div>
      <div>
        <ApexChart options={options} series={series} type="radialBar" height={300} />
      </div>
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-theme-sm dark:text-gray-400">
            Цель
          </span>
          <span className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
            {targetData?.target ? Number(targetData.target).toLocaleString() : '0'} ₸
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-theme-sm dark:text-gray-400">
            Текущий доход
          </span>
          <span className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
            {targetData?.currentRevenue ? Number(targetData.currentRevenue).toLocaleString() : '0'} ₸
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-theme-sm dark:text-gray-400">
            Сегодняшний доход
          </span>
          <span className="font-semibold text-blue-600 text-theme-sm dark:text-blue-400">
            +{targetData?.todayRevenue ? Number(targetData.todayRevenue).toLocaleString() : '0'} ₸
          </span>
        </div>
      </div>
    </div>
  );
}
