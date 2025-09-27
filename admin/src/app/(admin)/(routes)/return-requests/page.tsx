import RefundRequestsPage from "@/components/finance/pages/RefundRequestsPage";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export default function ReturnRequestsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageBreadcrumb pageTitle="Запросы на возврат" />
      
      {/* Refund Requests Management */}
      <RefundRequestsPage />
    </div>
  );
}
