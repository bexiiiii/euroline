"use client";
import React, { useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import BalanceTopUpTable from "./BalanceTopUpTable";
import FinanceStats from "./FinanceStats";
import FinanceToolbar from "./FinanceToolbar";
import ProcessRefundModal from "./ProcessRefundModal";
import RefundHistoryTable from "./RefundHistoryTable";
import RefundRequestsTable from "./RefundRequestsTable";
import TopUpBalanceModal from "./TopUpBalanceModal";
import ViewRefundModal from "./ViewRefundModal";
import { financeApi, RefundRequest, TopUpResponse } from "@/lib/api/finance";

const FinanceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"topup" | "requests" | "history">("topup");
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isProcessRefundModalOpen, setIsProcessRefundModalOpen] = useState(false);
  const [isViewRefundModalOpen, setIsViewRefundModalOpen] = useState(false);
  const [selectedTopUp, setSelectedTopUp] = useState<TopUpResponse | null>(null);
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [refundRefreshKey, setRefundRefreshKey] = useState(0);

  const handleTopUpBalance = (data: TopUpResponse) => {
    setSelectedTopUp(data);
    setIsTopUpModalOpen(true);
  };

  const handleProcessRefund = (data: RefundRequest) => {
    setSelectedRefund(data);
    setIsProcessRefundModalOpen(true);
  };

  const handleViewRefund = (data: RefundRequest) => {
    setSelectedRefund(data);
    setIsViewRefundModalOpen(true);
  };

  const handleSaveTopUp = async (
    customerId: number,
    amount: number,
    paymentMethod: string,
    notes?: string
  ) => {
    await financeApi.createTopUp({ clientId: customerId, amount, paymentMethod, adminComment: notes });
    setIsTopUpModalOpen(false);
    setSelectedTopUp(null);
  };

  const handleUpdateTopUp = async (
    payload: { id: number; status?: string; paymentMethod?: string; adminComment?: string }
  ) => {
    await financeApi.updateTopUpStatus(payload.id, {
      status: payload.status,
      paymentMethod: payload.paymentMethod,
      adminComment: payload.adminComment,
    });
    setIsTopUpModalOpen(false);
    setSelectedTopUp(null);
  };

  const handleSaveRefund = async (
    refundId: number,
    status: RefundRequest["status"],
    notes?: string
  ) => {
    await financeApi.updateRefundStatus(refundId, { status, adminComment: notes });
    setRefundRefreshKey((prev) => prev + 1);
    setIsProcessRefundModalOpen(false);
    setSelectedRefund(null);
  };

  const tabs = [
    { id: "topup", label: "Пополнение баланса", count: 12 },
    { id: "requests", label: "Запросы на возврат", count: 8 },
    { id: "history", label: "История возвратов", count: 156 },
  ];

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <FinanceStats />

      {/* Toolbar */}
      <FinanceToolbar />

      {/* Main Content */}
      <ComponentCard title="Финансовые операции">
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  activeTab === tab.id
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === "topup" && (
            <BalanceTopUpTable onTopUpBalance={handleTopUpBalance} />
          )}
          
          {activeTab === "requests" && (
            <RefundRequestsTable
              onProcessRefund={handleProcessRefund}
              onViewRefund={handleViewRefund}
              refreshKey={refundRefreshKey}
            />
          )}
          
          {activeTab === "history" && (
            <RefundHistoryTable
              onViewRefund={handleViewRefund}
            />
          )}
        </div>
      </ComponentCard>

      {/* Modals */}
      <TopUpBalanceModal
        isOpen={isTopUpModalOpen}
        mode={selectedTopUp ? "view" : "create"}
        topUp={selectedTopUp}
        onClose={() => {
          setIsTopUpModalOpen(false);
          setSelectedTopUp(null);
        }}
        onCreate={handleSaveTopUp}
        onUpdate={handleUpdateTopUp}
      />

      <ProcessRefundModal
        isOpen={isProcessRefundModalOpen}
        onClose={() => {
          setIsProcessRefundModalOpen(false);
          setSelectedRefund(null);
        }}
        refundData={selectedRefund}
        onSave={handleSaveRefund}
      />

      <ViewRefundModal
        isOpen={isViewRefundModalOpen}
        onClose={() => {
          setIsViewRefundModalOpen(false);
          setSelectedRefund(null);
        }}
        refundData={selectedRefund}
      />
    </div>
  );
};

export default FinanceManagement;
