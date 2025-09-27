"use client";
import React, { useEffect, useState } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import { Order as ApiOrder, OrderStatus, PaymentStatus } from "@/lib/api/orders";

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (orderId: number, newStatus: OrderStatus, newPaymentStatus: PaymentStatus) => void;
  order: ApiOrder | null;
}

const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "PENDING", label: "Новый" },
  { value: "CONFIRMED", label: "Подтвержден" },
  { value: "CANCELLED", label: "Отменен" },
];

const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: "UNPAID", label: "Ожидает оплаты" },
  { value: "PAID", label: "Оплачен" },
  { value: "PARTIALLY_PAID", label: "Частично оплачен" },
  { value: "REFUNDED", label: "Возврат" },
];

const EditOrderModal: React.FC<EditOrderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  order,
}) => {
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("PENDING");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("UNPAID");

  useEffect(() => {
    if (order) {
      setOrderStatus(order.status as OrderStatus);
      setPaymentStatus(order.paymentStatus as PaymentStatus);
    }
  }, [order]);

  const handleSave = () => {
    if (order) {
      onSave(order.id, orderStatus, paymentStatus);
    }
  };

  if (!order) return null;

  const orderNumber = order.code || `ORD-${order.id.toString().padStart(6, "0")}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Редактирование заказа
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {orderNumber} — {order.customerName || "Клиент"}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Order Status */}
          <div>
            <Label>Статус заказа</Label>
            <select
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            >
              {ORDER_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status */}
          <div>
            <Label>Статус оплаты</Label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            >
              {PAYMENT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Info */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              Информация о клиенте
            </h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Имя:</span>
                <span className="ml-2 text-sm text-gray-900 dark:text-white">
                  {order.customerName || "—"}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Email:</span>
                <span className="ml-2 text-sm text-gray-900 dark:text-white">
                  {order.customerEmail || "—"}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Телефон:</span>
                <span className="ml-2 text-sm text-gray-900 dark:text-white">
                  {order.customerPhone || "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSave}>
            Сохранить изменения
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditOrderModal;
