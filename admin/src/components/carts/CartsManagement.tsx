"use client";
import React, { useState } from "react";
import CartsStats from "@/components/carts/CartsStats";
import CartsToolbar from "@/components/carts/CartsToolbar";
import AbandonedCartsTable from "@/components/carts/AbandonedCartsTable";
import ViewCartModal from "@/components/carts/ViewCartModal";
import { cartsApi, CustomerCart } from "@/lib/api/carts";
import { ExportDateRange } from "@/components/common/ExportWithDateRange";
import { exportAdminData } from "@/lib/api/importExport";
import { useToast } from "@/context/ToastContext";

const CartsManagement: React.FC = () => {
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCart, setSelectedCart] = useState<CustomerCart | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { success: showSuccess, error: showError } = useToast();

  const errorMessage = (error: unknown, fallback: string) =>
    error instanceof Error && error.message ? error.message : fallback;

  const handleViewCart = async (cartId: number) => {
    try {
      const cart = await cartsApi.getCart(cartId);
      setSelectedCart(cart);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error("Ошибка при загрузке корзины:", error);
      showError(errorMessage(error, "Не удалось загрузить корзину"));
    }
  };

  const handleSendReminder = async (cartId: number) => {
    try {
      await cartsApi.sendAbandonedCartEmail(cartId);
      showSuccess(`Напоминание по корзине #${cartId} отправлено`);
    } catch (error) {
      console.error("Ошибка при отправке напоминания:", error);
      showError(errorMessage(error, "Не удалось отправить напоминание"));
    }
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
    if (!window.confirm(`Очистить корзину #${cartId}? Все товары будут удалены из корзины клиента.`)) {
      return;
    }
    try {
      await cartsApi.clearCart(cartId);
      showSuccess(`Корзина #${cartId} очищена`);
      setIsViewModalOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Ошибка при очистке корзины:", error);
      showError(errorMessage(error, "Не удалось очистить корзину"));
    }
  };

  const handleConvertToOrder = async (cartId: number) => {
    if (!window.confirm(`Оформить заказ из корзины #${cartId}?`)) {
      return;
    }
    try {
      const result = await cartsApi.convertCartToOrder(cartId);
      showSuccess(
        result?.orderId
          ? `Создан заказ #${result.orderId} из корзины #${cartId}`
          : `Заказ из корзины #${cartId} создан`
      );
      setIsViewModalOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Ошибка при конвертации корзины в заказ:", error);
      showError(errorMessage(error, "Не удалось оформить заказ из корзины"));
    }
  };

  return (
    <div className="space-y-4">
      <CartsStats refreshTrigger={refreshTrigger} />
      <AbandonedCartsTable
        actions={
          <CartsToolbar
            onExport={handleExportCarts}
            onRefresh={handleRefreshCarts}
          />
        }
        onViewCart={handleViewCart}
        onSendReminder={handleSendReminder}
        onClearCart={handleClearCart}
        onConvertToOrder={handleConvertToOrder}
        refreshTrigger={refreshTrigger}
      />
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
