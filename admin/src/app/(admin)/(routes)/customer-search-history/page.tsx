"use client";

import { useState } from "react";
import SearchHistoryTable from "../../../../components/customers/SearchHistoryTable";
import SearchAnalyticsStats from "../../../../components/customers/SearchAnalyticsStats";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";

export default function CustomerSearchHistoryPage() {
  const [refreshKey, setRefreshKey] = useState(() => Date.now());

  const triggerRefresh = () => setRefreshKey(Date.now());

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="История поиска клиентов" />

      <SearchAnalyticsStats refreshKey={refreshKey} />

      <SearchHistoryTable refreshKey={refreshKey} />

      <div className="flex justify-end">
        <button
          onClick={triggerRefresh}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Обновить данные
        </button>
      </div>
    </div>
  );
}
