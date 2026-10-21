"use client";

import { useState } from "react";
import SearchHistoryTable from "@/components/customers/SearchHistoryTable";
import SearchAnalyticsStats from "@/components/customers/SearchAnalyticsStats";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";

export default function CustomerSearchHistoryPage() {
  const [refreshKey, setRefreshKey] = useState(() => Date.now());

  const triggerRefresh = () => setRefreshKey(Date.now());

  return (
    <div className="space-y-4">
      <PageBreadcrumb pageTitle="История поиска" />

      <SearchAnalyticsStats refreshKey={refreshKey} />

      <SearchHistoryTable
        refreshKey={refreshKey}
        actions={
          <Button
            size="sm"
            variant="outline"
            className="h-10 py-0"
            onClick={triggerRefresh}
            startIcon={
              <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
          >
            Обновить
          </Button>
        }
      />
    </div>
  );
}
