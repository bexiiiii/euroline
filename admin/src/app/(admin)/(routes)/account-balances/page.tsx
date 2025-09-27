import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import AccountBalancesPage from "@/components/finance/pages/AccountBalancesPage";


export default function AccountBalancesPageRoute() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageBreadcrumb pageTitle="Остатки на счетах" />
      
      {/* Account Balances Management */}
      <AccountBalancesPage />
    </div>
  );
}
