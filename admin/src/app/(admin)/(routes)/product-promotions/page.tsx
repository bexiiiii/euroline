import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ProductPromotionsPage from "@/components/marketing/pages/ProductPromotionsPage";


export default function ProductPromotionsPageRoute() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageBreadcrumb pageTitle="Акции на товары" />
      
      {/* Product Promotions Management */}
      <ProductPromotionsPage />
    </div>
  );
}
