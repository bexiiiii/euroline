"use client";
import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { analyticsApi } from "@/lib/api/analytics";
import WidgetError from "./WidgetError";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface HeatmapDataPoint {
  day: string;
  hour: number;
  sales: number;
}

export default function SalesHeatmap() {
  const [loading, setLoading] = useState(true);
  const [heatmapData, setHeatmapData] = useState<HeatmapDataPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyticsApi.getSalesHeatmap();
      setHeatmapData(result ?? []);
    } catch (err) {
      console.error("Failed to fetch sales heatmap:", err);
      setError("Не удалось загрузить тепловую карту");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Пиковый час и самый активный день по реальным данным
  const dayFullNames: Record<string, string> = {
    "Пн": "Понедельник",
    "Вт": "Вторник",
    "Ср": "Среда",
    "Чт": "Четверг",
    "Пт": "Пятница",
    "Сб": "Суббота",
    "Вс": "Воскресенье",
  };
  const hourTotals = new Map<number, number>();
  const dayTotals = new Map<string, number>();
  heatmapData.forEach((item) => {
    const sales = Number(item.sales) || 0;
    hourTotals.set(item.hour, (hourTotals.get(item.hour) ?? 0) + sales);
    dayTotals.set(item.day, (dayTotals.get(item.day) ?? 0) + sales);
  });
  const pickMax = <K,>(totals: Map<K, number>): K | null => {
    let bestKey: K | null = null;
    let bestValue = 0;
    totals.forEach((total, key) => {
      if (total > bestValue) {
        bestValue = total;
        bestKey = key;
      }
    });
    return bestKey as K | null;
  };
  const peakHour = pickMax(hourTotals);
  const activeDay = pickMax(dayTotals);
  const pad = (h: number) => `${String(h % 24).padStart(2, "0")}:00`;
  const peakHourLabel = peakHour === null ? "—" : `${pad(peakHour)} - ${pad(peakHour + 1)}`;
  const activeDayLabel = activeDay === null ? "—" : dayFullNames[activeDay] ?? activeDay;

  // Трансформируем данные для ApexCharts
  const transformDataForChart = () => {
    const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
    return days.map((day) => {
      const dayData = heatmapData
        .filter((item) => item.day === day)
        .sort((a, b) => a.hour - b.hour)
        .map((item) => item.sales);
      
      return {
        name: day,
        data: dayData.length > 0 ? dayData : Array(24).fill(0),
      };
    });
  };

  const series = transformDataForChart();

  const options: ApexOptions = {
    chart: {
      type: "heatmap",
      fontFamily: "Outfit, sans-serif",
      height: 280,
      toolbar: { show: false },
    },
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.5,
        radius: 4,
        useFillColorAsStroke: true,
        colorScale: {
          ranges: [
            { from: 0, to: 10, name: "Низкая", color: "#E3F2FD" },
            { from: 11, to: 25, name: "Средняя", color: "#64B5F6" },
            { from: 26, to: 40, name: "Высокая", color: "#1976D2" },
            { from: 41, to: 100, name: "Очень высокая", color: "#0D47A1" },
          ],
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: 1,
    },
    xaxis: {
      type: "category",
      categories: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      labels: {
        rotate: -45,
        rotateAlways: true,
      },
    },
    yaxis: {
      reversed: false,
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} заказов`,
      },
    },
    legend: {
      show: true,
      position: "bottom",
    },
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
          Активность по часам
        </h3>
        {!loading && !error && peakHour !== null && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Пик: {peakHourLabel}, {activeDayLabel.toLowerCase()}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[280px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
        </div>
      ) : error ? (
        <WidgetError message="Не удалось загрузить данные" onRetry={fetchData} className="h-[280px] py-0" />
      ) : (
        <ReactApexChart options={options} series={series} type="heatmap" height={260} />
      )}
    </div>
  );
}
