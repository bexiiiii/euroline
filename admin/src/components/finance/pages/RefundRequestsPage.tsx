"use client";
import React, { useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import FinanceStats from "../FinanceStats";
import FinanceToolbar from "../FinanceToolbar";
import RefundRequestsTable from "../RefundRequestsTable";
import ProcessRefundModal from "../ProcessRefundModal";
import ViewRefundModal from "../ViewRefundModal";
import { financeApi, RefundRequest } from "@/lib/api/finance";

const RefundRequestsPage: React.FC = () => {
  const [isProcessRefundModalOpen, setIsProcessRefundModalOpen] = useState(false);
  const [isViewRefundModalOpen, setIsViewRefundModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RefundRequest | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleProcessRefund = (data: RefundRequest) => {
    setSelectedItem(data);
    setIsProcessRefundModalOpen(true);
  };

  const handleViewRefund = (data: RefundRequest) => {
    setSelectedItem(data);
    setIsViewRefundModalOpen(true);
  };

  const handleSaveRefund = async (
    refundId: number,
    status: RefundRequest["status"],
    notes?: string
  ) => {
    await financeApi.updateRefundStatus(refundId, {
      status,
      adminComment: notes,
    });
    setRefreshKey((prev) => prev + 1);
    setIsProcessRefundModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <FinanceStats />

      {/* Toolbar */}
      <FinanceToolbar />

      {/* Main Content */}
      <ComponentCard title="Запросы на возврат">
        <RefundRequestsTable
          onProcessRefund={handleProcessRefund}
          onViewRefund={handleViewRefund}
          refreshKey={refreshKey}
        />
      </ComponentCard>

      {/* Modals */}
      <ProcessRefundModal
        isOpen={isProcessRefundModalOpen}
        onClose={() => setIsProcessRefundModalOpen(false)}
        refundData={selectedItem}
        onSave={handleSaveRefund}
      />

      <ViewRefundModal
        isOpen={isViewRefundModalOpen}
        onClose={() => setIsViewRefundModalOpen(false)}
        refundData={selectedItem}
      />
    </div>
  );
};

export default RefundRequestsPage;
