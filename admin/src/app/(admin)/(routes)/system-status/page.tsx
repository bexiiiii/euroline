import SystemStatusPage from "@/components/technical/SystemStatusPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Состояние системы | Админ панель AutoParts",
  description: "Мониторинг состояния сервисов и системных метрик",
};

export default function SystemStatusPageRoute() {
  return <SystemStatusPage />;
}
