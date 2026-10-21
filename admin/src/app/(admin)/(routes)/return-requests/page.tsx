import type { Metadata } from "next";
import RefundRequestsPage from "@/components/finance/pages/RefundRequestsPage";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export const metadata: Metadata = {
  title: "Запросы на возврат",
};

export default function ReturnRequestsPage() {
  return (
    <div className="space-y-4">
      <PageBreadcrumb pageTitle="Запросы на возврат" />
      <RefundRequestsPage />
    </div>
  );
}
