import RefundHistoryPage from "@/components/finance/pages/RefundHistoryPage";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export default function ReturnHistoryPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageBreadcrumb pageTitle="История возвратов" />
      
      {/* Refund History Management */}
      <RefundHistoryPage />
    </div>
  );
}
