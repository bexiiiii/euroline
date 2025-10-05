import type { Metadata } from "next";
import React from "react";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";

export const metadata: Metadata = {
  title: "Аналитика | TailAdmin - Dashboard",
  description: "Профессиональная страница аналитики с полной статистикой",
};

export default function AnalyticsPage() {
  return <AnalyticsDashboard />;
}
