import { FinanceManagement } from "@/components/finance";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export default function FinancePage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageBreadcrumb pageTitle="Финансы и платежи" />
      
      {/* Finance Management */}
      <FinanceManagement />
    </div>
  );
}
