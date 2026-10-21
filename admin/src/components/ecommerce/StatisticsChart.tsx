"use client";
import React, { useCallback, useEffect, useState } from "react";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { analyticsApi } from "@/lib/api/analytics";
import WidgetError from "@/components/analytics/WidgetError";

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
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
      setLoading(true);
      setError(null);
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
        setError("Не удалось загрузить статистику");
      } finally {
        setLoading(false);
      }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const options: ApexOptions = {
    legend: {
      show: true, // Show legend
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#465FFF", "#9CB9FF"], // Define line colors
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 280,
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
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
        Продажи и выручка
      </h3>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-[280px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          </div>
        ) : error ? (
          <WidgetError message={error} onRetry={fetchData} className="h-[280px] py-0" />
        ) : (
          <div className="min-w-[700px] xl:min-w-full">
            <ReactApexChart
              options={options}
              series={series}
              type="area"
              height={280}
            />
          </div>
        )}
      </div>
    </div>
  );
}
