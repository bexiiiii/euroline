import type { Metadata } from "next";
import CartsManagement from "@/components/carts/CartsManagement";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export const metadata: Metadata = { title: "Корзины" };

export default function CartsPage() {
  return (
    <div className="space-y-4">
      <PageBreadcrumb pageTitle="Корзины" />
      <CartsManagement />
    </div>
  );
}
