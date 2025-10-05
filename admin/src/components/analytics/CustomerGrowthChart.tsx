"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { analyticsApi, ChartDataPoint } from "@/lib/api/analytics";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface CustomerGrowthData {
  month: string;
  newCustomers: number;
  totalCustomers: number;
}

export default function CustomerGrowthChart() {
  const [loading, setLoading] = useState(true);
  const [monthlyGrowth, setMonthlyGrowth] = useState<CustomerGrowthData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const customerData = await analyticsApi.getCustomerGrowthChart();
        
        const monthNames = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
        
        // Transform data to include cumulative totals
        let cumulativeTotal = 0;
        const transformedData = customerData.map((point: ChartDataPoint) => {
          const [year, month] = point.date.split('-');
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
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const options: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "line",
      height: 350,
      toolbar: { show: false },
    },
    colors: ["#00BCD4", "#4CAF50"],
    stroke: {
      curve: "smooth",
      width: [3, 3],
    },
    dataLabels: { enabled: false },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "right",
    },
    xaxis: {
      categories: monthlyGrowth.map((d) => d.month),
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: [
      {
        title: { text: "Новые клиенты" },
        labels: {
          formatter: (val: number) => Math.round(val).toString(),
        },
      },
      {
        opposite: true,
        title: { text: "Всего клиентов" },
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
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Рост клиентской базы
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Динамика прироста клиентов
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[350px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
        </div>
      ) : (
        <ReactApexChart options={options} series={series} type="line" height={350} />
      )}

      {monthlyGrowth.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-cyan-50 p-4 dark:bg-cyan-900/10">
            <p className="text-sm text-gray-600 dark:text-gray-400">Новых за месяц</p>
            <p className="mt-2 text-2xl font-bold text-cyan-600 dark:text-cyan-400">
              {monthlyGrowth[monthlyGrowth.length - 1].newCustomers}
            </p>
          </div>
          <div className="rounded-xl bg-green-50 p-4 dark:bg-green-900/10">
            <p className="text-sm text-gray-600 dark:text-gray-400">Всего клиентов</p>
            <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
              {monthlyGrowth[monthlyGrowth.length - 1].totalCustomers}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
