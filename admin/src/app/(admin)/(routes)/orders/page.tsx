import type { Metadata } from "next";
import OrdersManagement from "@/components/orders/OrdersManagement";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export const metadata: Metadata = { title: "Заказы" };

export default function OrdersPage() {
  return (
    <div className="space-y-4">
      <PageBreadcrumb pageTitle="Заказы" />
      <OrdersManagement />
    </div>
  );
}
