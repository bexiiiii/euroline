import { ReturnsManagement } from "@/components/returns";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export default function ReturnsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageBreadcrumb pageTitle="Управление возвратами" />
      
      {/* Returns Management */}
      <ReturnsManagement />
    </div>
  );
}
