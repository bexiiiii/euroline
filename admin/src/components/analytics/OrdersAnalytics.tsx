"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { analyticsApi, ChartDataPoint } from "@/lib/api/analytics";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function OrdersAnalytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await analyticsApi.getMonthlySales();
        setData(result);
      } catch (error) {
        console.error("Failed to fetch monthly sales:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const monthNames = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
  
  const categories = data.map((d) => {
    const [year, month] = d.date.split('-');
    return monthNames[parseInt(month) - 1];
  });

  const seriesData = data.map((d) => Math.round(d.value));

  const options: ApexOptions = {
    colors: ["#9C27B0"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 350,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 8,
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
      title: { text: "Количество заказов" },
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
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Динамика заказов
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Количество заказов по месяцам
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[350px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <ReactApexChart options={options} series={series} type="bar" height={350} />
      )}
    </div>
  );
}
