"use client";
import React, { useMemo } from "react";
import { Modal } from "../ui/modal";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import { Order as ApiOrder, OrderStatus, PaymentStatus } from "@/lib/api/orders";
import { formatKzt, formatDateTime } from "@/lib/format";

interface ViewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ApiOrder | null;
  isLoading?: boolean;
}

type BadgeColor = "primary" | "success" | "error" | "warning" | "info" | "light" | "dark";

const orderStatusMeta: Record<OrderStatus, { label: string; color: BadgeColor }> = {
  PENDING: { label: "Новый", color: "info" },
  CONFIRMED: { label: "Подтвержден", color: "primary" },
  CANCELLED: { label: "Отменен", color: "error" },
};

const paymentStatusMeta: Record<PaymentStatus, { label: string; color: BadgeColor }> = {
  UNPAID: { label: "Ожидает оплаты", color: "warning" },
  PAID: { label: "Оплачен", color: "success" },
  REFUNDED: { label: "Возврат", color: "error" },
  PARTIALLY_PAID: { label: "Частично оплачен", color: "info" },
};

const ViewOrderModal: React.FC<ViewOrderModalProps> = ({
  isOpen,
  onClose,
  order,
  isLoading = false,
}) => {
  const { itemsTotal, deliveryFee } = useMemo(() => {
    if (!order) {
      return { itemsTotal: 0, deliveryFee: 0 };
    }

    const total = (order.items ?? []).reduce((acc, item) => {
      const unitPrice = typeof item.price === "number" ? item.price : Number(item.price ?? 0);
      const rawTotal = item.total ?? unitPrice * item.quantity;
      const safeTotal = Number.isFinite(rawTotal) ? rawTotal : 0;
      return acc + safeTotal;
    }, 0);
    const delivery = Math.max((order.totalAmount ?? 0) - total, 0);
    return { itemsTotal: total, deliveryFee: delivery };
  }, [order]);

  if (!order) return null;

  const statusMeta = orderStatusMeta[order.status as OrderStatus] ?? {
    label: String(order.status),
    color: "light" as BadgeColor,
  };

  const paymentMeta = paymentStatusMeta[order.paymentStatus as PaymentStatus] ?? {
    label: String(order.paymentStatus),
    color: "light" as BadgeColor,
  };

  const customerRows: { label: string; value: string }[] = [
    { label: "Имя", value: order.customerName || "—" },
    { label: "Эл. почта", value: order.customerEmail || "—" },
    { label: "Телефон", value: order.customerPhone || "—" },
  ];
  if (order.deliveryAddress) customerRows.push({ label: "Адрес", value: order.deliveryAddress });

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-5">
        <div className="mb-4 pr-10">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Заказ {order.code || `№ ${order.id}`}
            </h2>
            <Badge size="sm" variant="light" color={statusMeta.color}>{statusMeta.label}</Badge>
            <Badge size="sm" variant="light" color={paymentMeta.color}>{paymentMeta.label}</Badge>
          </div>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {formatDateTime(order.createdAt)}
            {isLoading ? " · обновление..." : ""}
          </p>
        </div>

        <div className="space-y-4">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {customerRows.map((row) => (
              <div key={row.label} className={row.label === "Адрес" ? "sm:col-span-2" : ""}>
                <dt className="text-xs text-gray-500 dark:text-gray-400">{row.label}</dt>
                <dd className="text-sm text-gray-800 dark:text-white/90">{row.value}</dd>
              </div>
            ))}
          </dl>

          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
            <table className="min-w-full text-sm">
              <thead className="border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Товар</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Цена</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Кол-во</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Сумма</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2.5">
                        <p className="text-gray-800 dark:text-white/90">{item.productName || "—"}</p>
                        {(item.sku || item.productCode) && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{item.sku || item.productCode}</p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-gray-700 dark:text-gray-300">
                        {formatKzt(item.price ?? 0)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-gray-700 dark:text-gray-300">
                        {item.quantity}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right font-medium tabular-nums text-gray-800 dark:text-white/90">
                        {formatKzt(item.total ?? (item.price ?? 0) * item.quantity)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                      Нет данных о товарах
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="ml-auto max-w-xs space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Товары</span>
              <span className="tabular-nums text-gray-800 dark:text-white/90">{formatKzt(itemsTotal)}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Доставка</span>
                <span className="tabular-nums text-gray-800 dark:text-white/90">{formatKzt(deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-100 pt-1 dark:border-gray-800">
              <span className="font-medium text-gray-800 dark:text-white/90">Итого</span>
              <span className="font-semibold tabular-nums text-gray-800 dark:text-white/90">
                {formatKzt(order.totalAmount || itemsTotal)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button size="sm" variant="outline" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ViewOrderModal;
