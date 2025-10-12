"use client";
import React, { useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import OrdersStats from "@/components/orders/OrdersStats";
import OrdersToolbar from "@/components/orders/OrdersToolbar";
import ViewOrderModal from "@/components/orders/ViewOrderModal";
import EditOrderModal from "@/components/orders/EditOrderModal";
import OrdersTable from "./OrdersTable";
import { Order as ApiOrder, ordersApi, OrderStatus, PaymentStatus } from "@/lib/api/orders";
import { useToast } from "@/context/ToastContext";
import { ExportDateRange } from "@/components/common/ExportWithDateRange";

const OrdersManagement: React.FC = () => {
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [refreshToken, setRefreshToken] = useState<string>(`${Date.now()}`);
  const { success: showSuccess, error: showError } = useToast();

  const updateSelectedOrder = (order: ApiOrder | null) => {
    setSelectedOrder(order);
  };

  const fetchOrderDetails = async (orderId: number) => {
    try {
      setIsLoadingOrder(true);
      const details = await ordersApi.getOrder(orderId);
      updateSelectedOrder(details);
    } catch (error) {
      console.error("Не удалось загрузить детали заказа", error);
    } finally {
      setIsLoadingOrder(false);
    }
  };

  const handleViewOrder = (order: ApiOrder) => {
    updateSelectedOrder(order);
    setIsViewModalOpen(true);
    fetchOrderDetails(order.id);
  };

  const handleEditOrder = (order: ApiOrder) => {
    updateSelectedOrder(order);
    setIsEditModalOpen(true);
    fetchOrderDetails(order.id);
  };

  const handleUpdateStatus = async (
    orderId: number,
    status: OrderStatus,
    paymentStatus: PaymentStatus
  ) => {
    try {
      let updatedOrder = selectedOrder;
      if (!selectedOrder || selectedOrder.status !== status) {
        updatedOrder = await ordersApi.updateOrderStatus(orderId, status);
      }
      if (!updatedOrder || updatedOrder.paymentStatus !== paymentStatus) {
        updatedOrder = await ordersApi.updatePaymentStatus(orderId, paymentStatus);
      }
      if (updatedOrder) {
        updateSelectedOrder(updatedOrder);
      }
      setRefreshToken(`${Date.now()}`);
    } catch (error) {
      console.error("Не удалось обновить заказ", error);
    } finally {
      setIsEditModalOpen(false);
    }
  };

  const handleExportOrders = async ({ from, to }: ExportDateRange) => {
    try {
      const blob = await ordersApi.exportOrders({ fromDate: from, toDate: to, sort: "createdAt,desc" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `orders-${from}-${to}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showSuccess("Экспорт заказов сформирован");
    } catch (error) {
      console.error("Не удалось экспортировать заказы", error);
      showError("Не удалось экспортировать заказы");
    }
  };

  const handleRefreshOrders = () => {
    setRefreshToken(`${Date.now()}`);
  };

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <OrdersStats />

      {/* Панель инструментов */}
      <OrdersToolbar
        onExport={handleExportOrders}
        onRefresh={handleRefreshOrders}
      />

      {/* Таблица заказов */}
      <ComponentCard title="Список заказов">
        <OrdersTable
          onViewOrder={handleViewOrder}
          onEditOrder={handleEditOrder}
          refreshToken={refreshToken}
        />
      </ComponentCard>

      {/* Модальные окна */}
      <ViewOrderModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        order={selectedOrder}
        isLoading={isLoadingOrder}
      />

      <EditOrderModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdateStatus}
        order={selectedOrder}
      />
    </div>
  );
};

export default OrdersManagement;
