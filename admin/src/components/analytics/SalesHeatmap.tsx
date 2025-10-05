"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { analyticsApi } from "@/lib/api/analytics";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface HeatmapDataPoint {
  day: string;
  hour: number;
  sales: number;
}

export default function SalesHeatmap() {
  const [loading, setLoading] = useState(true);
  const [heatmapData, setHeatmapData] = useState<HeatmapDataPoint[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await analyticsApi.getSalesHeatmap();
        setHeatmapData(result);
      } catch (error) {
        console.error("Failed to fetch sales heatmap:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
      height: 350,
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
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Тепловая карта продаж
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Активность по часам и дням недели
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[350px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <ReactApexChart options={options} series={series} type="heatmap" height={300} />
          
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-900/10">
              <p className="text-sm text-gray-600 dark:text-gray-400">Пиковые часы</p>
              <p className="mt-2 text-lg font-bold text-blue-600 dark:text-blue-400">
                10:00 - 16:00
              </p>
            </div>
            <div className="rounded-xl bg-purple-50 p-4 dark:bg-purple-900/10">
              <p className="text-sm text-gray-600 dark:text-gray-400">Самый активный день</p>
              <p className="mt-2 text-lg font-bold text-purple-600 dark:text-purple-400">
                Среда
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
