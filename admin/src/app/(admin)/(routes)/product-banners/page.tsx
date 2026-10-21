import type { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ProductBannersPage from "@/components/marketing/pages/ProductBannersPage";

export const metadata: Metadata = {
  title: "Рекламные баннеры",
};

export default function ProductBannersPageRoute() {
  return (
    <div className="space-y-4">
      <PageBreadcrumb pageTitle="Рекламные баннеры" />
      <ProductBannersPage />
    </div>
  );
}
