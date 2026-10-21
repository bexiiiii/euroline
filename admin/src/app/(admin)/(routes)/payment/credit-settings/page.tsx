import type { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import CreditSettingsPage from "@/components/finance/pages/CreditSettingsPage";

export const metadata: Metadata = {
  title: "Кредитные лимиты",
};

export default function CreditSettingsRoute() {
  return (
    <div className="space-y-4">
      <PageBreadcrumb pageTitle="Кредитные лимиты" />
      <CreditSettingsPage />
    </div>
  );
}
