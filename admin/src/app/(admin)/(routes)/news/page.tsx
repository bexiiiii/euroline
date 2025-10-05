import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import NewsManagement from "@/components/news/NewsManagement";

export default function NewsPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Управление новостями" />
      <NewsManagement />
    </div>
  );
}