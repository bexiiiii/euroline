import type { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import UsersManagement from "@/components/users/UsersManagement";

export const metadata: Metadata = {
  title: "Пользователи",
};

export default function UsersPage() {
  return (
    <div className="space-y-4">
      <PageBreadcrumb pageTitle="Пользователи" />
      <UsersManagement />
    </div>
  );
}
