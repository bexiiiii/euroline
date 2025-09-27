import TechnicalSettingsPage from "@/components/technical/TechnicalSettingsPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Технические настройки | Админ панель AutoParts",
  description: "Управление техническими параметрами и конфигурацией системы",
};

export default function TechnicalSettingsPageRoute() {
  return <TechnicalSettingsPage />;
}
