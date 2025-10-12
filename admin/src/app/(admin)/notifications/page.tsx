import type { Metadata } from "next";
import React from "react";
import AdminNotificationsPage from "@/components/notifications/AdminNotificationsPage";

export const metadata: Metadata = {
  title: "Уведомления | TailAdmin - Dashboard",
  description: "Отправляйте системные уведомления и просматривайте историю рассылок",
};

export default function NotificationsPage() {
  return <AdminNotificationsPage />;
}

