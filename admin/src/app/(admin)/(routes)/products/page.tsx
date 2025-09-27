import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ProductsManagement from "@/components/products/ProductsManagement";

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Управление товарами" />
      <ProductsManagement />
    </div>
  );
}
