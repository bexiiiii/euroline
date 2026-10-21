import type { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import NewsManagement from "@/components/news/NewsManagement";

export const metadata: Metadata = {
  title: "Новости",
};

export default function NewsPage() {
  return (
    <div className="space-y-4">
      <PageBreadcrumb pageTitle="Новости" />
      <NewsManagement />
    </div>
  );
}
