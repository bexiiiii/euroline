"use client";
import React, { useCallback, useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import FinanceStats from "../FinanceStats";
import FinanceToolbar from "../FinanceToolbar";
import TopUpBalanceModal from "../TopUpBalanceModal";
import BalanceTopUpTable from "@/components/finance/BalanceTopUpTable";
import { financeApi, TopUpResponse } from "@/lib/api/finance";

const BalanceTopUpPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "create">("view");
  const [selectedTopUp, setSelectedTopUp] = useState<TopUpResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const openViewModal = useCallback((topUp: TopUpResponse) => {
    setSelectedTopUp(topUp);
    setModalMode("view");
    setIsModalOpen(true);
  }, []);

  const openCreateModal = useCallback(() => {
    setSelectedTopUp(null);
    setModalMode("create");
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedTopUp(null);
  }, []);

  const handleCreateTopUp = useCallback(
    async (payload: { clientId: number; amount: number; paymentMethod?: string; adminComment?: string }) => {
      try {
        await financeApi.createTopUp({
          clientId: payload.clientId,
          amount: payload.amount,
          paymentMethod: payload.paymentMethod,
          adminComment: payload.adminComment,
        });
        setRefreshKey((prev) => prev + 1);
      } catch (error) {
        console.error("Ошибка создания пополнения", error);
        throw error instanceof Error ? error : new Error("Не удалось создать пополнение");
      }
    },
    []
  );

  const handleUpdateTopUp = useCallback(
    async (payload: { id: number; status?: string; paymentMethod?: string; adminComment?: string }) => {
      try {
        await financeApi.updateTopUpStatus(payload.id, {
          status: payload.status,
          paymentMethod: payload.paymentMethod,
          adminComment: payload.adminComment,
        });
        setRefreshKey((prev) => prev + 1);
      } catch (error) {
        console.error("Ошибка обновления пополнения", error);
        throw error instanceof Error ? error : new Error("Не удалось обновить заявку");
      }
    },
    []
  );

  return (
    <div className="space-y-6">
      <FinanceStats />

      <FinanceToolbar
        title="Пополнение баланса"
        description="Управление запросами на пополнение баланса клиентов"
        showAddButton
        addButtonText="Создать пополнение"
        onAddClick={openCreateModal}
      />

      <ComponentCard title="Заявки на пополнение">
        <BalanceTopUpTable onTopUpBalance={openViewModal} refreshKey={refreshKey} />
      </ComponentCard>

      <TopUpBalanceModal
        isOpen={isModalOpen}
        mode={modalMode}
        topUp={selectedTopUp}
        onClose={closeModal}
        onCreate={handleCreateTopUp}
        onUpdate={handleUpdateTopUp}
      />
    </div>
  );
};

export default BalanceTopUpPage;
