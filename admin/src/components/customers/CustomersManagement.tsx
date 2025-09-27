"use client";
import React, { useState } from "react";
import CustomersStats from "./CustomersStats";
import CustomersToolbar from "./CustomersToolbar";
import CustomersTable from "./CustomersTable";
import SearchHistoryTable from "./SearchHistoryTable";
import { customersApi } from "@/lib/api/customers";

const CustomersManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'customers' | 'search-history'>('customers');
  const [refreshToken, setRefreshToken] = useState(() => Date.now());

  const triggerRefresh = () => setRefreshToken(Date.now());

  // Customers handlers
  const handleAddCustomer = () => {
    console.log('Add customer modal');
  };

  const handleExport = () => {
    console.log('Export customers data');
  };

  const handleRefresh = () => {
    triggerRefresh();
  };

  const handleSendNewsletter = () => {
    customersApi.sendNewsletter({
      subject: 'Новости магазина Autoparts',
      message: 'Спасибо, что вы с нами! Мы подготовили подборку свежих предложений.\n\n— Команда Autoparts',
    }).then(() => {
      console.log('Newsletter request sent');
    }).catch((error) => {
      console.error('Failed to send newsletter:', error);
    });
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <CustomersStats refreshKey={refreshToken} />

      {/* Toolbar */}
      <CustomersToolbar
        onAddCustomer={handleAddCustomer}
        onExport={handleExport}
        onRefresh={handleRefresh}
        onSendNewsletter={handleSendNewsletter}
      />

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="border-b border-gray-200 dark:border-gray-800">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('customers')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'customers'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Клиенты
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('search-history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'search-history'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                История поиска
              </div>
            </button>

            {/* Disabled Customer Reviews Tab */}
            <button
              disabled
              className="py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-400 dark:text-gray-600 cursor-not-allowed"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Клиентские отзывы
                <span className="ml-1 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  Скоро
                </span>
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'customers' && (
            <div>
              <CustomersTable
                refreshKey={refreshToken}
                onDataChanged={triggerRefresh}
              />
            </div>
          )}

          {activeTab === 'search-history' && (
            <div>
              <SearchHistoryTable
                refreshKey={refreshToken}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomersManagement;
