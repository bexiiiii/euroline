import ApiManagementPage from "@/components/technical/ApiManagementPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Управление API | Админ панель AutoParts",
  description: "Настройка API endpoints, ключей и мониторинг использования",
};

export default function ApiManagementPageRoute() {
  return <ApiManagementPage />;
}
