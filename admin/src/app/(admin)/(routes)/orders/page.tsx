import OrdersManagement from "@/components/orders/OrdersManagement";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageBreadcrumb pageTitle="Управление заказами" />
      
      {/* Orders Management */}
      <OrdersManagement />
    </div>
  );
}
