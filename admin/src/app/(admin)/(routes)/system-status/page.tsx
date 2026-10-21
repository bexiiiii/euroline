import SystemStatusPage from "@/components/technical/SystemStatusPage";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Состояние системы",
};

export default function SystemStatusPageRoute() {
  return (
    <>
      <PageBreadcrumb pageTitle="Состояние системы" />
      <SystemStatusPage />
    </>
  );
}
