"use client";
import React, { useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import FinanceStats from "@/components/finance/FinanceStats";
import FinanceToolbar from "@/components/finance/FinanceToolbar";
import AccountBalancesTable from "@/components/finance/AccountBalancesTable";
import ViewBalanceModal from "@/components/finance/ViewBalanceModal";
import AdjustBalanceModal from "@/components/finance/AdjustBalanceModal";
import { ClientBalance, financeApi } from "@/lib/api/finance";

const AccountBalancesPage: React.FC = () => {
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<ClientBalance | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleViewBalance = (data: ClientBalance) => {
    setSelectedAccount(data);
    setIsViewModalOpen(true);
  };

  const handleAdjustBalance = (data: ClientBalance) => {
    setSelectedAccount(data);
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjustment = async (
    accountId: number,
    adjustmentType: "add" | "subtract",
    amount: number,
    reason: string
  ) => {
    try {
      const delta = adjustmentType === "add" ? amount : -amount;
      const response = await financeApi.adjustBalance(accountId, {
        delta,
        reason,
      });

      setSelectedAccount((prev) =>
        prev && prev.clientId === response.clientId
          ? {
              ...prev,
              balance: response.balance,
              updatedAt: response.updatedAt,
            }
          : prev
      );

      setRefreshKey((key) => key + 1);
      setIsAdjustModalOpen(false);
    } catch (error) {
      console.error("Ошибка при корректировке баланса:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <FinanceStats />

      {/* Toolbar */}
      <FinanceToolbar
        title="Остатки на счетах"
        description="Управление балансами клиентов и корректировка остатков"
        showAddButton={false}
      />

      {/* Main Content */}
      <ComponentCard title="Остатки на счетах клиентов">
        <AccountBalancesTable
          onViewBalance={handleViewBalance}
          onAdjustBalance={handleAdjustBalance}
          refreshKey={refreshKey}
        />
      </ComponentCard>

      {/* Modals */}
      <ViewBalanceModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        accountData={selectedAccount}
      />
      
      <AdjustBalanceModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        accountData={selectedAccount}
        onSave={handleSaveAdjustment}
      />
    </div>
  );
};

export default AccountBalancesPage;
