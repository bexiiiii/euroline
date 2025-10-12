"use client";
import React, { useState, useEffect } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import CartsStats from "@/components/carts/CartsStats";
import CartsToolbar from "@/components/carts/CartsToolbar";
import AbandonedCartsTable from "@/components/carts/AbandonedCartsTable";
import ViewCartModal from "@/components/carts/ViewCartModal";
import { cartsApi, CustomerCart } from "@/lib/api/carts";
import { ExportDateRange } from "@/components/common/ExportWithDateRange";
import { exportAdminData } from "@/lib/api/importExport";
import { useToast } from "@/context/ToastContext";

const CartsManagement: React.FC = () => {
  const [selectedCarts, setSelectedCarts] = useState<number[]>([]);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCart, setSelectedCart] = useState<CustomerCart | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { success: showSuccess, error: showError } = useToast();

  const handleViewCart = async (cartId: number) => {
    try {
      const cart = await cartsApi.getCart(cartId);
      setSelectedCart(cart);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error("Ошибка при загрузке корзины:", error);
    }
  };

  const handleSendReminder = async (cartId: number) => {
    try {
      await cartsApi.sendAbandonedCartEmail(cartId);
      console.log("Напоминание отправлено для корзины:", cartId);
      // Показать уведомление об успехе
    } catch (error) {
      console.error("Ошибка при отправке напоминания:", error);
      // Показать уведомление об ошибке
    }
  };

  const handleSendBulkReminders = () => {
    console.log("Отправка массовых напоминаний");
    // TODO: Реализовать массовую отправку напоминаний
  };

  const buildFileName = (base: string, from?: string, to?: string) => {
    const parts = [base];
    if (from) parts.push(from);
    if (to && to !== from) parts.push(to);
    return `${parts.join("-")}.csv`;
  };

  const handleExportCarts = async ({ from, to }: ExportDateRange) => {
    try {
      await exportAdminData({
        type: "carts",
        from: from || undefined,
        to: to || undefined,
        fileName: buildFileName("carts", from, to),
      });
      showSuccess("Экспорт корзин сформирован");
    } catch (error) {
      console.error("Не удалось экспортировать корзины", error);
      showError("Не удалось экспортировать корзины");
    }
  };

  const handleRefreshCarts = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleClearCart = async (cartId: number) => {
    try {
      await cartsApi.clearCart(cartId);
      setRefreshTrigger(prev => prev + 1);
      console.log("Корзина очищена:", cartId);
    } catch (error) {
      console.error("Ошибка при очистке корзины:", error);
    }
  };

  const handleConvertToOrder = async (cartId: number) => {
    try {
      const result = await cartsApi.convertCartToOrder(cartId);
      console.log("Корзина конвертирована в заказ:", result.orderId);
      setRefreshTrigger(prev => prev + 1);
      // Показать уведомление об успехе
    } catch (error) {
      console.error("Ошибка при конвертации корзины в заказ:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <CartsStats refreshTrigger={refreshTrigger} />

      {/* Панель инструментов */}
      <CartsToolbar
        onSendBulkReminders={handleSendBulkReminders}
        onExport={handleExportCarts}
        onRefresh={handleRefreshCarts}
      />

      {/* Таблица брошенных корзин */}
      <ComponentCard title="Управление корзинами">
        <AbandonedCartsTable
          onViewCart={handleViewCart}
          onSendReminder={handleSendReminder}
          onClearCart={handleClearCart}
          onConvertToOrder={handleConvertToOrder}
          refreshTrigger={refreshTrigger}
        />
      </ComponentCard>

      {/* Модальное окно просмотра корзины */}
      <ViewCartModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        cart={selectedCart}
        onSendReminder={handleSendReminder}
        onClearCart={handleClearCart}
        onConvertToOrder={handleConvertToOrder}
      />
    </div>
  );
};

export default CartsManagement;
