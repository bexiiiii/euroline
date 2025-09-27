"use client";
import React from "react";
import Button from "../ui/button/Button";
import ProductsModal from "./productsmodal";

interface ProductsToolbarProps {
  onExport: () => void;
  onImport: () => void;
  onSyncWith1C: () => void;
  onProductCreated: () => void;
}

const ProductsToolbar: React.FC<ProductsToolbarProps> = ({
  onExport,
  onImport,
  onSyncWith1C,
  onProductCreated,
}) => {
  const handleExport = () => {
    onExport();
  };

  const handleImport = () => {
    onImport();
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Инструменты управления
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Быстрые действия для работы с каталогом товаров
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={handleImport}
            startIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16a4 4 0 005 3.87V20a1 1 0 001 1h4a1 1 0 001-1v-.13A4 4 0 1016 12.1" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l-3-3m0 0l3-3m-3 3h12" />
              </svg>
            }
          >
            Импорт Excel
          </Button>

          {/* Export Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            startIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            }
          >
            Экспорт Excel
          </Button>
          <ProductsModal onCreated={onProductCreated} />

          <Button
            size="sm"
            variant="outline"
            onClick={onSyncWith1C}
            startIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 5.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            }
          >
            Синхронизировать 1С
          </Button>

          {/* Bulk Sync Button */}
          
        </div>
      </div>
    </div>
  );
};

export default ProductsToolbar;
