"use client";
import React from "react";
import Button from "../ui/button/Button";

interface CategoriesToolbarProps {
  onAddCategory: () => void;
  onExport: () => void;
  onImport: () => void;
}

const CategoriesToolbar: React.FC<CategoriesToolbarProps> = ({
  onAddCategory,
  onExport,
  onImport,
}) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
        <div className="flex flex-wrap gap-3">
          {/* Add Category Button */}
          <Button
            size="sm"
            onClick={onAddCategory}
            startIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Добавить категорию
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

          <Button
            size="sm"
            variant="outline"
            onClick={onImport}
            startIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16a4 4 0 005 3.87V20a1 1 0 001 1h4a1 1 0 001-1v-.13A4 4 0 1016 12.1" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l-3-3m0 0l3-3m-3 3h12" />
              </svg>
            }
          >
            Импорт
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CategoriesToolbar;
