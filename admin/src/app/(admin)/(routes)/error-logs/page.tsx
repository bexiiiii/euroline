import ErrorLogsPage from "@/components/technical/ErrorLogsPage";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Логи ошибок",
};

export default function ErrorLogsPageRoute() {
  return (
    <>
      <PageBreadcrumb pageTitle="Логи ошибок" />
      <ErrorLogsPage />
    </>
  );
}
