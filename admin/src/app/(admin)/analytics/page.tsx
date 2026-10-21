import type { Metadata } from "next";
import React from "react";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";

export const metadata: Metadata = {
  title: "Аналитика",
};

export default function AnalyticsPage() {
  return <AnalyticsDashboard />;
}
