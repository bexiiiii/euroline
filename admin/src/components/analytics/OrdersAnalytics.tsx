"use client";
import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { analyticsApi, ChartDataPoint } from "@/lib/api/analytics";
import WidgetError from "./WidgetError";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function OrdersAnalytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyticsApi.getMonthlySales();
      setData(result ?? []);
    } catch (err) {
      console.error("Failed to fetch monthly sales:", err);
      setError("Не удалось загрузить заказы");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const monthNames = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
  
  const categories = data.map((d) => {
    const month = d.date.split('-')[1];
    return monthNames[parseInt(month) - 1];
  });

  const seriesData = data.map((d) => Math.round(d.value));

  const options: ApexOptions = {
    colors: ["#465FFF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 280,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 4,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { formatter: (val: number) => Math.round(val).toString() },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} заказов`,
      },
    },
    grid: {
      borderColor: "#e5e7eb",
      strokeDashArray: 5,
    },
  };

  const series = [
    {
      name: "Заказы",
      data: seriesData,
    },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <h3 className="mb-3 text-base font-semibold text-gray-800 dark:text-white/90">
        Динамика заказов
      </h3>

      {loading ? (
        <div className="flex items-center justify-center h-[280px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
        </div>
      ) : error ? (
        <WidgetError message="Не удалось загрузить данные" onRetry={fetchData} className="h-[280px] py-0" />
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center h-[280px] text-sm text-gray-500 dark:text-gray-400">
          Данных пока нет
        </div>
      ) : (
        <ReactApexChart options={options} series={series} type="bar" height={280} />
      )}
    </div>
  );
}
