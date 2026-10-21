"use client";
import React from "react";
import ProductsModal from "./productsmodal";
import ExportWithDateRange, { ExportDateRange } from "@/components/common/ExportWithDateRange";

interface ProductsToolbarProps {
  onExport: (range: ExportDateRange) => Promise<void> | void;
  onProductCreated: () => void;
}

const ProductsToolbar: React.FC<ProductsToolbarProps> = ({
  onExport,
  onProductCreated,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <ExportWithDateRange
        triggerLabel="Экспорт CSV"
        variant="outline"
        size="sm"
        className="h-10 py-0"
        onConfirm={onExport}
        icon={
          <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0 0l-4-4m4 4l4-4" />
          </svg>
        }
        title="Экспорт товаров"
        description="Укажите период выгрузки."
      />
      <ProductsModal onCreated={onProductCreated} />
    </div>
  );
};

export default ProductsToolbar;
