import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ProductBannersPage from "@/components/marketing/pages/ProductBannersPage";

export default function ProductBannersPageRoute() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageBreadcrumb pageTitle="Рекламные баннеры" />
      
      {/* Product Banners Management */}
      <ProductBannersPage />
    </div>
  );
}
