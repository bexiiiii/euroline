import type { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import AccountBalancesPage from "@/components/finance/pages/AccountBalancesPage";

export const metadata: Metadata = {
  title: "Остатки на счетах",
};

export default function AccountBalancesPageRoute() {
  return (
    <div className="space-y-4">
      <PageBreadcrumb pageTitle="Остатки на счетах" />
      <AccountBalancesPage />
    </div>
  );
}
