"use client";
import React from "react";
import Button from "../ui/button/Button";
import ExportWithDateRange, { ExportDateRange } from "@/components/common/ExportWithDateRange";

interface FinanceToolbarProps {
  title?: string;
  description?: string;
  showAddButton?: boolean;
  addButtonText?: string;
  onAddClick?: () => void;
  onExport?: (range: ExportDateRange) => Promise<void> | void;
  onRefresh?: () => void;
  onGenerateReport?: () => void;
}

const FinanceToolbar: React.FC<FinanceToolbarProps> = ({
  title = "Финансовые операции",
  description = "Управление пополнениями баланса и возвратами",
  showAddButton = false,
  addButtonText = "Добавить",
  onAddClick,
  onExport,
  onRefresh,
  onGenerateReport,
}) => {
  const handleExportFinance = (range: ExportDateRange) => {
    if (onExport) {
      return onExport(range);
    }
    console.log("Экспорт финансовых данных", range);
    return undefined;
  };

  const handleRefreshData = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      console.log("Обновление данных");
    }
  };

  const handleGenerateReport = () => {
    if (onGenerateReport) {
      onGenerateReport();
    } else {
      console.log("Генерация отчета");
    }
  };

  const handleAddClick = () => {
    if (onAddClick) {
      onAddClick();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          {showAddButton && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddClick}
              startIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              }
            >
              {addButtonText}
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshData}
            startIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
          >
            Обновить
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateReport}
            startIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          >
            Отчет
          </Button>
          
          <ExportWithDateRange
            triggerLabel="Экспорт"
            variant="outline"
            size="sm"
            onConfirm={handleExportFinance}
            title="Экспорт финансов"
            description="Выберите период для экспорта финансовых операций в CSV."
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
        </div>
      </div>
    </div>
  );
};

export default FinanceToolbar;
