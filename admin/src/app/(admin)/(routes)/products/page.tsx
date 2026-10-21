import type { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ProductsManagement from "@/components/products/ProductsManagement";

export const metadata: Metadata = { title: "Товары" };

export default function ProductsPage() {
  return (
    <div className="space-y-4">
      <PageBreadcrumb pageTitle="Товары" />
      <ProductsManagement />
    </div>
  );
}
