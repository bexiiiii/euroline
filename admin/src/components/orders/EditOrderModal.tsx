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

  const orderNumber = order.code || `№ ${order.id}`;

  const selectClass =
    "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-5">
        <div className="mb-4 pr-10">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Заказ {orderNumber}
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {[order.customerName, order.customerPhone || order.customerEmail].filter(Boolean).join(" · ") || "Клиент не указан"}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Статус заказа</Label>
            <select
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
              className={selectClass}
            >
              {ORDER_STATUS_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={option.value === "PENDING" && order.status !== "PENDING"}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Статус оплаты</Label>
            <p className="flex h-10 items-center text-sm text-gray-800 dark:text-white/90">
              {PAYMENT_STATUS_OPTIONS.find((option) => option.value === paymentStatus)?.label ?? paymentStatus}
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button size="sm" onClick={handleSave}>
            Сохранить
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditOrderModal;
