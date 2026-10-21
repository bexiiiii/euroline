import type { Metadata } from "next";
import React from "react";
import AdminNotificationsPage from "@/components/notifications/AdminNotificationsPage";

export const metadata: Metadata = {
  title: "Уведомления",
};

export default function NotificationsPage() {
  return <AdminNotificationsPage />;
}

