import CartsManagement from "@/components/carts/CartsManagement";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export default function CartsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageBreadcrumb pageTitle="Управление корзинами" />

      {/* Carts Management */}
      <CartsManagement />
    </div>
  );
}
