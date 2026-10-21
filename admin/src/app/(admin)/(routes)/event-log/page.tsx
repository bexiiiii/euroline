import EventLogPage from "@/components/events/EventLogPage";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Журнал событий",
};

export default function EventLogPageRoute() {
  return (
    <>
      <PageBreadcrumb pageTitle="Журнал событий" />
      <EventLogPage />
    </>
  );
}
