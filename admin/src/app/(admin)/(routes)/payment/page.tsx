import BalanceTopUpPage from "@/components/finance/pages/BalanceTopUpPage";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export default function PaymentPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageBreadcrumb pageTitle="Пополнение баланса" />
      
      {/* Balance Top Up Management */}
      <BalanceTopUpPage />
    </div>
  );
}
