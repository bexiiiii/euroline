"use client";
import React from "react";

interface StatCard {
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease" | "neutral";
  icon: React.ReactNode;
  color: string;
}

const OrdersStats: React.FC = () => {
  const stats: StatCard[] = [
    {
      title: "Всего заказов",
      value: "2,847",
      change: "+12.5%",
      changeType: "increase",
      color: "bg-blue-500",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      title: "Новые заказы",
      value: "127",
      change: "+8.2%",
      changeType: "increase",
      color: "bg-green-500",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      title: "В обработке",
      value: "89",
      change: "-3.1%",
      changeType: "decrease",
      color: "bg-yellow-500",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Выполнено",
      value: "2,631",
      change: "+15.3%",
      changeType: "increase",
      color: "bg-purple-500",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
  ];

  const getChangeColor = (changeType: "increase" | "decrease" | "neutral") => {
    switch (changeType) {
      case "increase":
        return "text-green-600 dark:text-green-400";
      case "decrease":
        return "text-red-600 dark:text-red-400";
      case "neutral":
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getChangeIcon = (changeType: "increase" | "decrease" | "neutral") => {
    if (changeType === "increase") {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
        </svg>
      );
    }
    if (changeType === "decrease") {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
        </svg>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 transition-all duration-200 hover:shadow-lg dark:hover:shadow-gray-900/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                {stat.title}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {stat.value}
              </p>
              <div className={`flex items-center gap-1 text-sm ${getChangeColor(stat.changeType)}`}>
                {getChangeIcon(stat.changeType)}
                <span className="font-medium">{stat.change}</span>
                <span className="text-gray-500 dark:text-gray-400">от прошлого месяца</span>
              </div>
            </div>
            <div className={`${stat.color} text-white p-3 rounded-lg`}>
              {stat.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrdersStats;
