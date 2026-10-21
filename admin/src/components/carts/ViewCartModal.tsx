"use client";
import React from "react";
import { Modal } from "../ui/modal";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import { CustomerCart } from "@/lib/api/carts";
import { formatKzt, formatDateTime } from "@/lib/format";

interface ViewCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CustomerCart | null;
  onSendReminder?: (cartId: number) => void;
  onClearCart?: (cartId: number) => void;
  onConvertToOrder?: (cartId: number) => void;
}

const ViewCartModal: React.FC<ViewCartModalProps> = ({
  isOpen,
  onClose,
  cart,
  onSendReminder,
  onClearCart,
  onConvertToOrder,
}) => {
  if (!cart) return null;

  const fields: { label: string; value: React.ReactNode }[] = [
    { label: "Клиент", value: cart.customerName || "—" },
    { label: "Эл. почта", value: cart.customerEmail || "—" },
    { label: "Создана", value: formatDateTime(cart.createdAt) },
    { label: "Обновлена", value: formatDateTime(cart.lastUpdated) },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-5">
        <div className="mb-4 flex items-center gap-2 pr-10">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Корзина #{cart.id}
          </h2>
          <Badge size="sm" color={cart.isAbandoned ? "warning" : "success"} variant="light">
            {cart.isAbandoned ? "Брошенная" : "Активная"}
          </Badge>
        </div>

        <div className="space-y-4">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.label}>
                <dt className="text-xs text-gray-500 dark:text-gray-400">{f.label}</dt>
                <dd className="text-sm text-gray-800 dark:text-white/90">{f.value}</dd>
              </div>
            ))}
          </dl>

          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {cart.items.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">Корзина пуста</li>
              ) : (
                cart.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate text-gray-800 dark:text-white/90">{item.productName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.productSku} · {item.quantity} × {formatKzt(item.price)}
                      </p>
                    </div>
                    <span className="whitespace-nowrap font-medium tabular-nums text-gray-800 dark:text-white/90">
                      {formatKzt(item.totalPrice)}
                    </span>
                  </li>
                ))
              )}
            </ul>
            <div className="flex justify-between border-t border-gray-200 px-4 py-2.5 text-sm dark:border-gray-800">
              <span className="text-gray-500 dark:text-gray-400">Итого, {cart.totalItems} шт.</span>
              <span className="font-semibold tabular-nums text-gray-800 dark:text-white/90">{formatKzt(cart.totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          {onClearCart && (
            <Button
              size="sm"
              variant="outline"
              className="mr-auto"
              onClick={() => onClearCart(cart.id)}
            >
              Очистить
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={onClose}>
            Закрыть
          </Button>
          {cart.isAbandoned && onSendReminder && (
            <Button size="sm" variant="outline" onClick={() => onSendReminder(cart.id)}>
              Напомнить клиенту
            </Button>
          )}
          {onConvertToOrder && (
            <Button size="sm" onClick={() => onConvertToOrder(cart.id)}>
              Оформить заказ
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ViewCartModal;
