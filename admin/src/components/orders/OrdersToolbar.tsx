"use client";
import React from "react";
import Button from "../ui/button/Button";
import ExportWithDateRange, { ExportDateRange } from "@/components/common/ExportWithDateRange";

interface OrdersToolbarProps {
  onExport: (range: ExportDateRange) => Promise<void> | void;
  onRefresh: () => void;
}

const OrdersToolbar: React.FC<OrdersToolbarProps> = ({
  onExport,
  onRefresh,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button
        size="sm"
        variant="outline"
        className="h-10 py-0"
        onClick={onRefresh}
        startIcon={
          <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        }
      >
        Обновить
      </Button>
      <ExportWithDateRange
        triggerLabel="Экспорт CSV"
        variant="outline"
        size="sm"
        className="h-10 py-0"
        onConfirm={onExport}
        title="Экспорт заказов"
        description="Укажите период выгрузки."
        icon={
          <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0 0l-4-4m4 4l4-4" />
          </svg>
        }
      />
    </div>
  );
};

export default OrdersToolbar;
