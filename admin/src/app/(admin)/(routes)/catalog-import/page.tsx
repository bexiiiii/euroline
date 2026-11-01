import type { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import CatalogImportManager from "@/components/catalogImport/CatalogImportManager";

export const metadata: Metadata = { title: "Импорт PDF-каталога" };

export default function CatalogImportPage() {
  return (
    <div className="space-y-4">
      <PageBreadcrumb pageTitle="Импорт PDF-каталога" />
      <CatalogImportManager />
    </div>
  );
}
