import EventLogPage from "@/components/events/EventLogPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Журнал событий | Админ панель AutoParts",
  description: "Мониторинг и анализ событий системы AutoParts",
};

export default function EventLogPageRoute() {
  return <EventLogPage />;
}
