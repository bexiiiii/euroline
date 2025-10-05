"use client";
import React, { useEffect, useState } from "react";
// import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import ChartTab from "../common/ChartTab";
import dynamic from "next/dynamic";
import { analyticsApi } from "@/lib/api/analytics";

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function StatisticsChart() {
  const [chartData, setChartData] = useState({
    sales: [] as number[],
    revenue: [] as number[],
    categories: [] as string[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salesData, revenueData] = await Promise.all([
          analyticsApi.getMonthlySales(),
          analyticsApi.getMonthlyRevenue(),
        ]);
        
        const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
        const currentYear = new Date().getFullYear();
        
        // Создаем мапы для данных
        const salesMap: { [key: string]: number } = {};
        const revenueMap: { [key: string]: number } = {};
        
        // Инициализируем все месяцы текущего года
        months.forEach((_, index) => {
          const key = `${currentYear}-${String(index + 1).padStart(2, '0')}`;
          salesMap[key] = 0;
          revenueMap[key] = 0;
        });
        
        // Заполняем данными
        salesData.forEach(point => {
          salesMap[point.date] = point.value;
        });
        
        revenueData.forEach(point => {
          // Конвертируем в тысячи для лучшей читаемости
          revenueMap[point.date] = point.value / 1000;
        });
        
        // Получаем последние 12 месяцев
        const sortedKeys = Object.keys(salesMap).sort();
        const last12Months = sortedKeys.slice(-12);
        
        const sales = last12Months.map(key => salesMap[key]);
        const revenue = last12Months.map(key => revenueMap[key]);
        const categories = last12Months.map(key => {
          const monthIndex = parseInt(key.split('-')[1]) - 1;
          return months[monthIndex];
        });
        
        setChartData({ sales, revenue, categories });
      } catch (error) {
        console.error("Failed to fetch statistics:", error);
        // Fallback на пустые данные
        const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
        setChartData({
          sales: new Array(12).fill(0),
          revenue: new Array(12).fill(0),
          categories: months,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const options: ApexOptions = {
    legend: {
      show: true, // Show legend
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#465FFF", "#9CB9FF"], // Define line colors
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "line", // Set the chart type to 'line'
      toolbar: {
        show: false, // Hide chart toolbar
      },
    },
    stroke: {
      curve: "straight", // Define the line style (straight, smooth, or step)
      width: [2, 2], // Line width for each dataset
    },

    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    markers: {
      size: 0, // Size of the marker points
      strokeColors: "#fff", // Marker border color
      strokeWidth: 2,
      hover: {
        size: 6, // Marker size on hover
      },
    },
    grid: {
      xaxis: {
        lines: {
          show: false, // Hide grid lines on x-axis
        },
      },
      yaxis: {
        lines: {
          show: true, // Show grid lines on y-axis
        },
      },
    },
    dataLabels: {
      enabled: false, // Disable data labels
    },
    tooltip: {
      enabled: true, // Enable tooltip
      x: {
        format: "dd MMM yyyy", // Format for x-axis tooltip
      },
    },
    xaxis: {
      type: "category", // Category-based x-axis
      categories: chartData.categories,
      axisBorder: {
        show: false, // Hide x-axis border
      },
      axisTicks: {
        show: false, // Hide x-axis ticks
      },
      tooltip: {
        enabled: false, // Disable tooltip for x-axis points
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px", // Adjust font size for y-axis labels
          colors: ["#6B7280"], // Color of the labels
        },
      },
      title: {
        text: "", // Remove y-axis title
        style: {
          fontSize: "0px",
        },
      },
    },
  };

  const series = [
    {
      name: "Продажи",
      data: chartData.sales,
    },
    {
      name: "Выручка (тыс. ₸)",
      data: chartData.revenue,
    },
  ];
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
                <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Статистика
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Целевые показатели за каждый месяц
          </p>
        </div>
        <div className="flex items-start w-full gap-3 sm:justify-end">
          <ChartTab />
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-[310px]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="min-w-[1000px] xl:min-w-full">
            <ReactApexChart
              options={options}
              series={series}
              type="area"
              height={310}
            />
          </div>
        )}
      </div>
    </div>
  );
}
