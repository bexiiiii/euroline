import SiteSettingsPage from "@/components/technical/SiteSettingsPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Настройки сайта | Админ панель AutoParts",
  description: "Конфигурация основных параметров и интеграций сайта",
};

export default function SiteSettingsPageRoute() {
  return <SiteSettingsPage />;
}
