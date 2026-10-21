"use client";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { analyticsApi } from "@/lib/api/analytics";
import WidgetError from "@/components/analytics/WidgetError";

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function MonthlySalesChart() {
  const [salesData, setSalesData] = useState<number[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSalesData = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await analyticsApi.getMonthlySales();
        
        // Преобразуем данные в формат для графика
        const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
        const currentYear = new Date().getFullYear();
        const salesByMonth: { [key: string]: number } = {};
        
        // Инициализируем все месяцы текущего года нулями
        months.forEach((month, index) => {
          const key = `${currentYear}-${String(index + 1).padStart(2, '0')}`;
          salesByMonth[key] = 0;
        });
        
        // Заполняем данными с бэкенда
        data.forEach(point => {
          salesByMonth[point.date] = point.value;
        });
        
        // Получаем последние 12 месяцев
        const sortedKeys = Object.keys(salesByMonth).sort();
        const last12Months = sortedKeys.slice(-12);
        
        const values = last12Months.map(key => salesByMonth[key]);
        const labels = last12Months.map(key => {
          const monthIndex = parseInt(key.split('-')[1]) - 1;
          return months[monthIndex];
        });
        
        setSalesData(values);
        setCategories(labels);
      } catch (error) {
        console.error("Failed to fetch sales data:", error);
        setError("Не удалось загрузить продажи");
      } finally {
        setLoading(false);
      }
  }, []);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 260,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories: categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    legend: {
      show: false,
    },
    yaxis: {
      title: {
        text: undefined,
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },

    tooltip: {
      x: {
        show: false,
      },
      y: {
        formatter: (val: number) => `${val} продаж`,
      },
    },
  };
  
  const series = [
    {
      name: "Продажи",
      data: salesData,
    },
  ];
  
  return (
    <div className="h-full overflow-hidden rounded-xl border border-gray-200 bg-white p-4 pb-2 dark:border-gray-800 dark:bg-white/[0.03]">
      <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
        Продажи по месяцам
      </h3>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-[260px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          </div>
        ) : error ? (
          <WidgetError message={error} onRetry={fetchSalesData} className="h-[260px] py-0" />
        ) : (
          <div className="min-w-[600px] xl:min-w-0">
            <ReactApexChart
              options={options}
              series={series}
              type="bar"
              height={260}
            />
          </div>
        )}
      </div>
    </div>
  );
}
