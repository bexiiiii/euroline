import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PromotionHistoryPage from "@/components/marketing/pages/PromotionHistoryPage";

export default function PromotionHistoryPageRoute() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageBreadcrumb pageTitle="История акций" />
      
      {/* Promotion History Management */}
      <PromotionHistoryPage />
    </div>
  );
}
