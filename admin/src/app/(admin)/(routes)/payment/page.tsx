import type { Metadata } from "next";
import BalanceTopUpPage from "@/components/finance/pages/BalanceTopUpPage";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export const metadata: Metadata = {
  title: "Пополнение баланса",
};

export default function PaymentPage() {
  return (
    <div className="space-y-4">
      <PageBreadcrumb pageTitle="Пополнение баланса" />
      <BalanceTopUpPage />
    </div>
  );
}
