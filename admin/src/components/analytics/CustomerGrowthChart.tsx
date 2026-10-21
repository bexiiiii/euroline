"use client";
import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { analyticsApi, ChartDataPoint } from "@/lib/api/analytics";
import WidgetError from "./WidgetError";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface CustomerGrowthData {
  month: string;
  newCustomers: number;
  totalCustomers: number;
}

export default function CustomerGrowthChart() {
  const [loading, setLoading] = useState(true);
  const [monthlyGrowth, setMonthlyGrowth] = useState<CustomerGrowthData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        const customerData = await analyticsApi.getCustomerGrowthChart();
        
        const monthNames = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
        
        // Transform data to include cumulative totals
        let cumulativeTotal = 0;
        const transformedData = customerData.map((point: ChartDataPoint) => {
          const month = point.date.split('-')[1];
          const monthIndex = parseInt(month) - 1;
          const newCustomers = Math.round(point.value);
          cumulativeTotal += newCustomers;
          
          return {
            month: monthNames[monthIndex],
            newCustomers,
            totalCustomers: cumulativeTotal,
          };
        });
        
        setMonthlyGrowth(transformedData);
      } catch (error) {
        console.error("Failed to fetch customer growth:", error);
        setError("Не удалось загрузить данные о клиентах");
      } finally {
        setLoading(false);
      }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const options: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "line",
      height: 280,
      toolbar: { show: false },
    },
    colors: ["#465FFF", "#9CB9FF"],
    stroke: {
      curve: "smooth",
      width: [2, 2],
    },
    dataLabels: { enabled: false },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
    },
    xaxis: {
      categories: monthlyGrowth.map((d) => d.month),
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: [
      {
        labels: {
          formatter: (val: number) => Math.round(val).toString(),
        },
      },
      {
        opposite: true,
        labels: {
          formatter: (val: number) => Math.round(val).toString(),
        },
      },
    ],
    tooltip: {
      shared: true,
      intersect: false,
    },
    grid: {
      borderColor: "#e5e7eb",
      strokeDashArray: 5,
    },
  };

  const series = [
    {
      name: "Новые клиенты",
      data: monthlyGrowth.map((d) => d.newCustomers),
    },
    {
      name: "Всего клиентов",
      data: monthlyGrowth.map((d) => d.totalCustomers),
    },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
          Рост клиентской базы
        </h3>
        {!loading && !error && monthlyGrowth.length > 0 && (
          <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
            За месяц: {monthlyGrowth[monthlyGrowth.length - 1].newCustomers.toLocaleString("ru-RU")}, всего:{" "}
            {monthlyGrowth[monthlyGrowth.length - 1].totalCustomers.toLocaleString("ru-RU")}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[280px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
        </div>
      ) : error ? (
        <WidgetError message="Не удалось загрузить данные" onRetry={fetchData} className="h-[280px] py-0" />
      ) : monthlyGrowth.length === 0 ? (
        <div className="flex items-center justify-center h-[280px] text-sm text-gray-500 dark:text-gray-400">
          Данных пока нет
        </div>
      ) : (
        <ReactApexChart options={options} series={series} type="line" height={280} />
      )}

    </div>
  );
}
