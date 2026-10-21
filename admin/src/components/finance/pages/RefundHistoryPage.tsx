"use client";
import React, { useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import FinanceStats from "../FinanceStats";
import Button from "@/components/ui/button/Button";
import { RefreshIcon } from "@/components/finance/tableUi";
import RefundHistoryTable from "../RefundHistoryTable";
import ViewRefundModal from "../ViewRefundModal";
import { RefundRequest } from "@/lib/api/finance";

const RefundHistoryPage: React.FC = () => {
  const [isViewRefundModalOpen, setIsViewRefundModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RefundRequest | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => setRefreshKey((prev) => prev + 1);

  const handleViewRefund = (data: RefundRequest) => {
    setSelectedItem(data);
    setIsViewRefundModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <FinanceStats refreshKey={refreshKey} />

      <ComponentCard
        title="Обработанные возвраты"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            startIcon={<RefreshIcon />}
          >
            Обновить
          </Button>
        }
      >
        <RefundHistoryTable
          onViewRefund={handleViewRefund}
          refreshKey={refreshKey}
        />
      </ComponentCard>

      <ViewRefundModal
        isOpen={isViewRefundModalOpen}
        onClose={() => setIsViewRefundModalOpen(false)}
        refundData={selectedItem}
      />
    </div>
  );
};

export default RefundHistoryPage;
