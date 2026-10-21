"use client";
import React from "react";
import Button from "../ui/button/Button";
import ExportWithDateRange, { ExportDateRange } from "@/components/common/ExportWithDateRange";

interface CategoriesToolbarProps {
  onAddCategory: () => void;
  onExport: (range: ExportDateRange) => Promise<void> | void;
}

const CategoriesToolbar: React.FC<CategoriesToolbarProps> = ({
  onAddCategory,
  onExport,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <ExportWithDateRange
        triggerLabel="Экспорт CSV"
        variant="outline"
        size="sm"
        className="h-10 py-0"
        onConfirm={onExport}
        title="Экспорт категорий"
        description="Укажите период выгрузки."
        icon={
          <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0 0l-4-4m4 4l4-4" />
          </svg>
        }
      />
      <Button
        size="sm"
        className="h-10 py-0"
        onClick={onAddCategory}
        startIcon={
          <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" viewBox="0 0 24 24">
            <path d="M12 5v14m7-7H5" />
          </svg>
        }
      >
        Добавить категорию
      </Button>
    </div>
  );
};

export default CategoriesToolbar;
