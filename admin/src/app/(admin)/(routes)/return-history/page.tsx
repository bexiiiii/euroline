import type { Metadata } from "next";
import RefundHistoryPage from "@/components/finance/pages/RefundHistoryPage";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export const metadata: Metadata = {
  title: "История возвратов",
};

export default function ReturnHistoryPage() {
  return (
    <div className="space-y-4">
      <PageBreadcrumb pageTitle="История возвратов" />
      <RefundHistoryPage />
    </div>
  );
}
