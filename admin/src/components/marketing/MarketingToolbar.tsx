"use client";
import React from "react";
import Button from "@/components/ui/button/Button";

interface ToolbarAction {
  label: string;
  variant: "primary" | "outline";
  onClick: () => void;
}

interface MarketingToolbarProps {
  title: string;
  description?: string;
  showAddButton?: boolean;
  addButtonText?: string;
  onAddClick?: () => void;
  showExportButton?: boolean;
  onExportClick?: () => void;
  actions?: ToolbarAction[];
  children?: React.ReactNode;
}

const MarketingToolbar: React.FC<MarketingToolbarProps> = ({
  title,
  description,
  showAddButton = false,
  addButtonText = "Создать",
  onAddClick,
  showExportButton = true,
  onExportClick,
  actions,
  children,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {children}
          
          {/* Custom Actions */}
          {actions && actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              size="sm"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
          
          {showExportButton && !actions && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportClick}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Экспорт
            </Button>
          )}
          
          {showAddButton && (
            <Button
              variant="primary"
              size="sm"
              onClick={onAddClick}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {addButtonText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketingToolbar;
