"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { analyticsApi, ChartDataPoint } from "@/lib/api/analytics";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface RevenueChartProps {
  dateRange: {
    from: string;
    to: string;
  };
}

export default function RevenueChart({ dateRange }: RevenueChartProps) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await analyticsApi.getRevenueChart(dateRange.from, dateRange.to);
        setData(result);
      } catch (error) {
        console.error("Failed to fetch revenue chart:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  const options: ApexOptions = {
    colors: ["#465FFF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "area",
      height: 350,
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: "smooth",
      width: 3,
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
      title: { text: "Выручка (₸)" },
      labels: {
        formatter: (val: number) => `${Math.round(val).toLocaleString()} ₸`,
      },
    },
    grid: {
      borderColor: "#e5e7eb",
      strokeDashArray: 5,
    },
    tooltip: {
      x: { format: "dd MMM yyyy" },
      y: {
        formatter: (val: number) => `${val.toLocaleString()} ₸`,
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
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Динамика выручки
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            График изменения выручки за выбранный период
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[350px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : data.length > 0 ? (
        <ReactApexChart options={options} series={series} type="area" height={350} />
      ) : (
        <div className="flex items-center justify-center h-[350px] text-gray-500 dark:text-gray-400">
          Нет данных за выбранный период
        </div>
      )}
    </div>
  );
}
