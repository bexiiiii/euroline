import ApiManagementPage from "@/components/technical/ApiManagementPage";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "API",
};

export default function ApiManagementPageRoute() {
  return (
    <>
      <PageBreadcrumb pageTitle="API" />
      <ApiManagementPage />
    </>
  );
}
