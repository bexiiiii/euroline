"use client";
import React, { useEffect, useState } from "react";
import CountryMap from "./CountryMap";
import { analyticsApi, CustomerDemographic } from "@/lib/api/analytics";

interface CountryData {
  country: string;
  visitors: number;
  percentage: number;
}

interface DemographicData {
  countries: CountryData[];
  totalVisitors: number;
}

const DemographicCard = () => {
  const [data, setData] = useState<DemographicData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDemographicData = async () => {
      try {
        const fallback: CustomerDemographic[] = [
          { country: "Казахстан", customers: 2450, percentage: 45.5 },
          { country: "Россия", customers: 1580, percentage: 29.3 },
        ];

        const raw = await analyticsApi
          .getCustomerDemographics()
          .catch(() => fallback);

        const countries: CountryData[] = raw.map((item) => ({
          country: item.country ?? "Unknown",
          visitors: item.visitors ?? item.customers ?? 0,
          percentage: item.percentage ?? 0,
        }));

        const totalVisitors = countries.reduce((sum, item) => sum + item.visitors, 0);

        setData({ countries, totalVisitors });
      } catch (error) {
        console.error("Failed to fetch demographic data:", error);
        // Set fallback data on error
        setData({
          countries: [
            { country: "Казахстан", visitors: 0, percentage: 100 }
          ],
          totalVisitors: 0
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDemographicData();
  }, []);

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-6 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="animate-pulse">
          <div className="h-6 w-32 bg-gray-200 rounded dark:bg-gray-800 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded dark:bg-gray-800 mb-4"></div>
          <div className="space-y-3">
            <div className="h-12 bg-gray-200 rounded dark:bg-gray-800"></div>
            <div className="h-12 bg-gray-200 rounded dark:bg-gray-800"></div>
            <div className="h-12 bg-gray-200 rounded dark:bg-gray-800"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-6 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          География клиентов
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Всего посетителей: {data?.totalVisitors.toLocaleString()}
        </p>
      </div>

      <div className="mb-6">
        <div className="h-64">
          <CountryMap />
        </div>
      </div>

      <div className="space-y-3">
        {data?.countries.map((country, index) => (
          <div
            key={index}
            className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 dark:border-gray-800"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {index + 1}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-white/90">
                  {country.country}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {country.visitors.toLocaleString()} посетителей
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-semibold text-gray-800 dark:text-white/90">
                {country.percentage}%
              </span>
              <div className="mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${country.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DemographicCard;
