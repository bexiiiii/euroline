"use client";
import React from "react";

interface StatCard {
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease" | "neutral";
  description?: string;
}

interface MarketingStatsProps {
  title?: string;
  stats?: StatCard[];
}

const MarketingStats: React.FC<MarketingStatsProps> = ({ 
  title = "Статистика маркетинга", 
  stats: customStats 
}) => {
  const defaultStats: StatCard[] = [
    {
      title: "Активные акции",
      value: "12",
      change: "+3",
      changeType: "increase",
      description: "промо-акций активно"
    },
    {
      title: "Товары в акциях",
      value: "248",
      change: "+15",
      changeType: "increase",
      description: "позиций участвует"
    },
    {
      title: "Активные баннеры",
      value: "8",
      change: "+2",
      changeType: "increase",
      description: "баннеров отображается"
    },
    {
      title: "Конверсия акций",
      value: "24.3%",
      change: "+2.1%",
      changeType: "increase",
      description: "эффективность промо"
    },
  ];

  const stats = customStats || defaultStats;

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case "increase":
        return "text-green-600 dark:text-green-400";
      case "decrease":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case "increase":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        );
      case "decrease":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                {stat.title}
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stat.value}
              </p>
              <div className={`flex items-center mt-2 text-sm ${getChangeColor(stat.changeType)}`}>
                {getChangeIcon(stat.changeType)}
                <span className="ml-1">{stat.change}</span>
                <span className="ml-1 text-gray-500 dark:text-gray-400">
                  за месяц
                </span>
              </div>
              {stat.description && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {stat.description}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MarketingStats;
