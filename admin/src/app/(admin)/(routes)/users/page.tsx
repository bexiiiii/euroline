import React from "react";
import { Metadata } from "next";
import UsersManagement from "../../../../components/users/UsersManagement";

export const metadata: Metadata = {
  title: "Управление пользователями | Admin Dashboard",
  description: "Управление пользователями системы, роли и права доступа",
};

export default function UsersPage() {
  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Управление пользователями
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Управляйте пользователями системы, назначайте роли и отслеживайте активность
        </p>
      </div>
      <UsersManagement />
    </div>
  );
}
