"use client";
import React, { useState, useEffect, useRef } from "react";


interface ComponentCardProps {
  title: string;
  children: React.ReactNode;
  className?: string; // Additional custom classes for styling
  desc?: string; // Description text
  description?: string; // Alternative description prop
  action?: React.ReactNode; // Action component (like toolbar)
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  title,
  children,
  className = "",
  desc = "",
  description = "",
  action,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Все");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Закрытие dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFiltersOpen(false);
      }
    };

    // Закрытие dropdown при нажатии Escape
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFiltersOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  const handleSync = () => {
    // TODO: Implement 1C synchronization
    alert("Запущена синхронизация с 1С...");
  };

  const filterOptions = [
    "Все",
    "Активные",
    "Неактивные", 
    "Нет в наличии",
    "1С",
    "Ручные"
  ];

  const handleFilterSelect = (filter: string) => {
    setActiveFilter(filter);
    setIsFiltersOpen(false);
  };

  return (
    <>
      {/* Card Header */}
      <div className="px-6">
        {(title || action) && (
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
            <div className="flex-1">
              {title && (
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {title}
                </h2>
              )}
              {(description || desc) && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {description || desc}
                </p>
              )}
            </div>
            {action && (
              <div className="flex-shrink-0">
                {action}
              </div>
            )}
          </div>
        )}
        
        {!title && desc && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {desc}
          </p>
        )}
      </div>

      {/* Card filters */}
      <div className="border-1 dark:border-gray-800 bg-white sm:p-6 rounded-lg ">
  <div className="space-y-6">
    {/* Фильтры + Поиск + Синхронизация */}
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      
      {/* Поиск */}
      <div className="flex items-center border rounded-md px-3 py-2 w-full lg:max-w-md dark:bg-gray-800 dark:border-gray-700">
        <svg
          className="w-5 h-5 text-gray-400 mr-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Поиск товаров..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-grow bg-transparent outline-none text-gray-900 dark:text-gray-100"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Очистить поиск"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Кнопки фильтров и синхронизация */}
      <div className="flex flex-wrap gap-2 lg:gap-3">
        {/* Dropdown фильтры */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
            </svg>
            Фильтры: {activeFilter}
            <svg 
              className={`w-4 h-4 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown menu */}
          {isFiltersOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="py-1">
                <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                  Фильтры товаров
                </div>
                {filterOptions.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => handleFilterSelect(filter)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      activeFilter === filter
                        ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{filter}</span>
                      {activeFilter === filter && (
                        <svg className="w-4 h-4 text-brand-500 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Кнопка синхронизации */}
        <button
          type="button"
          onClick={handleSync}
          className="px-4 py-2 rounded-md bg-brand-500 text-white hover:bg-brand-600 transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
          Синхронизировать с 1С
        </button>
      </div>
    </div>
    
    {/* Показать активные фильтры */}
    {(searchQuery || activeFilter !== "Все") && (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-500 dark:text-gray-400">Активные фильтры:</span>
        {searchQuery && (
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-gray-700 dark:text-gray-300">
            Поиск: &quot;{searchQuery}&quot;
          </span>
        )}
        {activeFilter !== "Все" && (
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-gray-700 dark:text-gray-300">
            {activeFilter}
          </span>
        )}
        <button
          onClick={() => {
            setSearchQuery("");
            setActiveFilter("Все");
            setIsFiltersOpen(false);
          }}
          className="text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
        >
          Сбросить все
        </button>
      </div>
    )}
  </div>
</div>

      {/* Card Body */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6">
        <div className="space-y-6">{children}</div>
      </div>
    </>
  );
};

export default ComponentCard;
