"use client";
import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { analyticsApi, ChartDataPoint } from "@/lib/api/analytics";
import { formatKzt } from "@/lib/format";
import WidgetError from "./WidgetError";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

/** YYYY-MM-DD в локальной таймзоне */
const toInputDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const defaultRange = () => {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 1);
  return { from: toInputDate(from), to: toInputDate(to) };
};

const dateInputClass =
  "h-9 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function RevenueChart() {
  const [dateRange, setDateRange] = useState(defaultRange);
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const rangeInvalid = Boolean(dateRange.from && dateRange.to && dateRange.from > dateRange.to);

  const fetchData = useCallback(async () => {
    if (!dateRange.from || !dateRange.to || dateRange.from > dateRange.to) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await analyticsApi.getRevenueChart(dateRange.from, dateRange.to);
      setData(result);
    } catch (err) {
      console.error("Failed to fetch revenue chart:", err);
      setError("Не удалось загрузить выручку");
    } finally {
      setLoading(false);
    }
  }, [dateRange.from, dateRange.to]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const options: ApexOptions = {
    colors: ["#465FFF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "area",
      height: 280,
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 90, 100],
      },
    },
    xaxis: {
      categories: data.map((d) => new Date(d.date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })),
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => formatKzt(val),
      },
    },
    grid: {
      borderColor: "#e5e7eb",
      strokeDashArray: 5,
    },
    tooltip: {
      x: { format: "dd MMM yyyy" },
      y: {
        formatter: (val: number) => formatKzt(val),
      },
    },
  };

  const series = [
    {
      name: "Выручка",
      data: data.map((d) => d.value),
    },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
          Динамика выручки
        </h3>
        <div className="flex items-center gap-2">
          <div>
            <input
              id="revenue-date-from"
              aria-label="Дата начала"
              type="date"
              value={dateRange.from}
              max={dateRange.to || undefined}
              onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
              className={dateInputClass}
            />
          </div>
          <span className="text-sm text-gray-400">-</span>
          <div>
            <input
              id="revenue-date-to"
              aria-label="Дата окончания"
              type="date"
              value={dateRange.to}
              min={dateRange.from || undefined}
              onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
              className={dateInputClass}
            />
          </div>
        </div>
      </div>

      {rangeInvalid ? (
        <div className="flex items-center justify-center h-[280px] text-sm text-error-600 dark:text-error-400">
          Дата начала должна быть раньше даты окончания
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-[280px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
        </div>
      ) : error ? (
        <WidgetError message="Не удалось загрузить данные" onRetry={fetchData} className="h-[280px] py-0" />
      ) : data.length > 0 ? (
        <ReactApexChart options={options} series={series} type="area" height={280} />
      ) : (
        <div className="flex items-center justify-center h-[280px] text-sm text-gray-500 dark:text-gray-400">
          Нет данных за период
        </div>
      )}
    </div>
  );
}
