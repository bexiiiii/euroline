import type { Metadata } from "next";
import { ReturnsManagement } from "@/components/returns";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export const metadata: Metadata = { title: "Возвраты" };

export default function ReturnsPage() {
  return (
    <div className="space-y-4">
      <PageBreadcrumb pageTitle="Возвраты" />
      <ReturnsManagement />
    </div>
  );
}
