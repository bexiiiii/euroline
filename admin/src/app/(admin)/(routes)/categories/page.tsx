import CategoriesManagement from "@/components/categories/CategoriesManagement";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageBreadcrumb pageTitle="Категории и подкатегории" />
      
      {/* Categories Management */}
      <CategoriesManagement />
    </div>
  );
}