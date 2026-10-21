"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { ApexOptions } from "apexcharts";
import { analyticsApi, MonthlyTargetSummary } from "@/lib/api/analytics";
import { formatKzt } from "@/lib/format";
import WidgetError from "@/components/analytics/WidgetError";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function MonthlyTarget() {
  const [targetData, setTargetData] = useState<MonthlyTargetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTargetData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyticsApi.getMonthlyTarget();
      setTargetData(data);
    } catch (error) {
      console.error("Failed to fetch monthly target:", error);
      setTargetData(null);
      setError("Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTargetData();
  }, [fetchTargetData]);

  const hasTarget = Number(targetData?.target ?? 0) > 0;
  const formatAmount = (value: number | string | null | undefined) =>
    value === null || value === undefined || value === "" ? "—" : formatKzt(value);

  const options: ApexOptions = {
    chart: {
      height: 220,
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
            fontSize: "22px",
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

  const series = [Math.round(targetData?.progressPercent ?? 0)];

  if (loading) {
    return (
      <div className="h-full rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="animate-pulse">
          <div className="mb-4 h-5 w-32 rounded bg-gray-200 dark:bg-gray-800"></div>
          <div className="h-56 rounded bg-gray-200 dark:bg-gray-800"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
          Месячная цель
        </h3>
        <WidgetError message={error} onRetry={fetchTargetData} className="py-12" />
      </div>
    );
  }

  return (
    <div className="h-full rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
        Месячная цель
      </h3>
      {hasTarget ? (
        <div>
          <ApexChart options={options} series={series} type="radialBar" height={220} />
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Цель на месяц не задана
        </p>
      )}
      <div className="mt-2 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Цель
          </span>
          <span className="text-sm font-medium tabular-nums text-gray-800 dark:text-white/90">
            {hasTarget ? formatAmount(targetData?.target) : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Текущий доход
          </span>
          <span className="text-sm font-medium tabular-nums text-gray-800 dark:text-white/90">
            {formatAmount(targetData?.currentRevenue)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Сегодняшний доход
          </span>
          <span className="text-sm font-medium tabular-nums text-gray-800 dark:text-white/90">
            {formatAmount(targetData?.todayRevenue)}
          </span>
        </div>
      </div>
    </div>
  );
}
