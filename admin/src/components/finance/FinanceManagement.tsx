"use client";
import React, { useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import BalanceTopUpTable from "./BalanceTopUpTable";
import FinanceStats from "./FinanceStats";
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
    payload: { clientId: number; amount: number; paymentMethod?: string; adminComment?: string }
  ) => {
    await financeApi.createTopUp(payload);
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
    { id: "topup", label: "Пополнение баланса" },
    { id: "requests", label: "Запросы на возврат" },
    { id: "history", label: "История возвратов" },
  ];

  return (
    <div className="space-y-4">
      <FinanceStats />

      <ComponentCard title="Финансовые операции">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex gap-6" aria-label="Разделы">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-4">
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
