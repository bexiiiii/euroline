"use client";
import React, { useCallback, useEffect, useState } from "react";
import { analyticsApi } from "@/lib/api/analytics";
import WidgetError from "@/components/analytics/WidgetError";

interface CountryData {
  country: string;
  visitors: number;
  percentage: number;
}

interface DemographicData {
  countries: CountryData[];
  totalVisitors: number;
}

const COUNTRY_LABELS: Record<string, string> = {
  kazakhstan: "Казахстан",
  kz: "Казахстан",
  russia: "Россия",
  "russian federation": "Россия",
  ru: "Россия",
  kyrgyzstan: "Кыргызстан",
  uzbekistan: "Узбекистан",
  belarus: "Беларусь",
  china: "Китай",
};

const countryLabel = (country: string | null | undefined): string => {
  const value = country?.trim();
  if (!value || value.toLowerCase() === "unknown") return "Не указано";
  return COUNTRY_LABELS[value.toLowerCase()] ?? value;
};

const DemographicCard = () => {
  const [data, setData] = useState<DemographicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDemographicData = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        const raw = await analyticsApi.getCustomerDemographics();

        const countries: CountryData[] = (raw ?? []).map((item) => ({
          country: countryLabel(item.country),
          visitors: item.visitors ?? item.customers ?? 0,
          percentage: item.percentage ?? 0,
        }));

        const totalVisitors = countries.reduce((sum, item) => sum + item.visitors, 0);

        setData({ countries, totalVisitors });
      } catch (error) {
        console.error("Failed to fetch demographic data:", error);
        setData(null);
        setError("Не удалось загрузить географию клиентов");
      } finally {
        setLoading(false);
      }
  }, []);

  useEffect(() => {
    fetchDemographicData();
  }, [fetchDemographicData]);

  if (loading) {
    return (
      <div className="overflow-hidden h-full rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="animate-pulse">
          <div className="mb-4 h-5 w-32 rounded bg-gray-200 dark:bg-gray-800"></div>
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
    <div className="overflow-hidden h-full rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
          География клиентов
        </h3>
        {data && (
          <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
            {data.totalVisitors.toLocaleString("ru-RU")} клиентов
          </span>
        )}
      </div>

      {error ? (
        <WidgetError message="Не удалось загрузить данные" onRetry={fetchDemographicData} />
      ) : !data || data.countries.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
          Данных пока нет
        </p>
      ) : (
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {data.countries.map((country, index) => (
          <li key={index} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                {country.country}
              </p>
              <p className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
                {country.visitors.toLocaleString("ru-RU")} клиентов
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full bg-brand-500"
                  style={{ width: `${Math.min(Math.max(country.percentage, 0), 100)}%` }}
                ></div>
              </div>
              <span className="w-10 text-right text-sm tabular-nums text-gray-700 dark:text-gray-300">
                {country.percentage}%
              </span>
            </div>
          </li>
        ))}
      </ul>
      )}
    </div>
  );
};

export default DemographicCard;
