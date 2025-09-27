import ErrorLogsPage from "@/components/technical/ErrorLogsPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Логи ошибок | Админ панель AutoParts",
  description: "Мониторинг и анализ ошибок системы",
};

export default function ErrorLogsPageRoute() {
  return <ErrorLogsPage />;
}
