import type { Metadata } from "next";
import CategoriesManagement from "@/components/categories/CategoriesManagement";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export const metadata: Metadata = { title: "Категории и подкатегории" };

export default function CategoriesPage() {
  return (
    <div className="space-y-4">
      <PageBreadcrumb pageTitle="Категории и подкатегории" />
      <CategoriesManagement />
    </div>
  );
}