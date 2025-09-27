"use client";
import React, { useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import FinanceStats from "../FinanceStats";
import FinanceToolbar from "../FinanceToolbar";
import RefundHistoryTable from "../RefundHistoryTable";
import ViewRefundModal from "../ViewRefundModal";

const RefundHistoryPage: React.FC = () => {
  const [isViewRefundModalOpen, setIsViewRefundModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const handleViewRefund = (data: any) => {
    setSelectedItem(data);
    setIsViewRefundModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <FinanceStats />

      {/* Toolbar */}
      <FinanceToolbar />

      {/* Main Content */}
      <ComponentCard title="История возвратов">
        <RefundHistoryTable
          onViewRefund={handleViewRefund}
        />
      </ComponentCard>

      {/* Modals */}
      <ViewRefundModal
        isOpen={isViewRefundModalOpen}
        onClose={() => setIsViewRefundModalOpen(false)}
        refundData={selectedItem}
      />
    </div>
  );
};

export default RefundHistoryPage;
