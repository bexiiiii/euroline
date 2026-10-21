"use client";
import React from "react";
import Button from "../ui/button/Button";
import ExportWithDateRange, { ExportDateRange } from "@/components/common/ExportWithDateRange";

interface FinanceToolbarProps {
  /** @deprecated Заголовок показывает PageBreadcrumb; проп оставлен для совместимости. */
  title?: string;
  /** @deprecated Описание больше не выводится; проп оставлен для совместимости. */
  description?: string;
  showAddButton?: boolean;
  addButtonText?: string;
  onAddClick?: () => void;
  /** Кнопка "Экспорт" показывается только если передан обработчик. */
  onExport?: (range: ExportDateRange) => Promise<void> | void;
  /** Кнопка "Обновить" показывается только если передан обработчик. */
  onRefresh?: () => void;
  /** Кнопка "Отчет" показывается только если передан обработчик. */
  onGenerateReport?: () => void;
}

const iconProps = {
  className: "size-4",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

const FinanceToolbar: React.FC<FinanceToolbarProps> = ({
  showAddButton = false,
  addButtonText = "Добавить",
  onAddClick,
  onExport,
  onRefresh,
  onGenerateReport,
}) => {
  const showAdd = showAddButton && Boolean(onAddClick);
  const hasActions = showAdd || Boolean(onRefresh || onGenerateReport || onExport);

  if (!hasActions) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {onRefresh && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          startIcon={
            <svg {...iconProps}>
              <path d="M20 11a8 8 0 0 0-14.9-3M4 5v4h4M4 13a8 8 0 0 0 14.9 3M20 19v-4h-4" />
            </svg>
          }
        >
          Обновить
        </Button>
      )}

      {onGenerateReport && (
        <Button
          variant="outline"
          size="sm"
          onClick={onGenerateReport}
          startIcon={
            <svg {...iconProps}>
              <path d="M9 17v-2m3 2v-4m3 4v-6M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
            </svg>
          }
        >
          Отчет
        </Button>
      )}

      {onExport && (
        <ExportWithDateRange
          triggerLabel="Экспорт"
          variant="outline"
          size="sm"
          onConfirm={onExport}
          title="Экспорт финансов"
          description="Период для выгрузки в CSV."
          icon={
            <svg {...iconProps}>
              <path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" />
            </svg>
          }
        />
      )}

      {showAdd && (
        <Button
          variant="primary"
          size="sm"
          onClick={onAddClick}
          startIcon={
            <svg {...iconProps}>
              <path d="M12 5v14M5 12h14" />
            </svg>
          }
        >
          {addButtonText}
        </Button>
      )}
    </div>
  );
};

export default FinanceToolbar;
