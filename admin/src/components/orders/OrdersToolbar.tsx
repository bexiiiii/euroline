"use client";
import React from "react";
import Button from "../ui/button/Button";

interface OrdersToolbarProps {
  onExport: () => void;
  onRefresh: () => void;
}

const OrdersToolbar: React.FC<OrdersToolbarProps> = ({
  onExport,
  onRefresh,
}) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Управление заказами
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Просмотр и обработка заказов клиентов
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* Refresh Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            startIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
          >
            Обновить
          </Button>

          {/* Export Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={onExport}
            startIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            }
          >
            Экспорт
          </Button>

          {/* Sync with 1C */}
          <Button
            size="sm"
            onClick={() => alert("Синхронизация с 1С...")}
            startIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
          >
            Синхронизация 1С
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrdersToolbar;
