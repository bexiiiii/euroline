"use client";
import React, { useMemo } from "react";
import { Modal } from "../ui/modal";
import Badge from "../ui/badge/Badge";
import { Order as ApiOrder, OrderStatus, PaymentStatus } from "@/lib/api/orders";

interface ViewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ApiOrder | null;
  isLoading?: boolean;
}

const orderStatusMeta: Record<OrderStatus, { label: string; color: string }> = {
  PENDING: { label: "Новый", color: "primary" },
  CONFIRMED: { label: "Подтвержден", color: "warning" },
  CANCELLED: { label: "Отменен", color: "error" },
};

const paymentStatusMeta: Record<PaymentStatus, { label: string; color: string }> = {
  UNPAID: { label: "Ожидает оплаты", color: "warning" },
  PAID: { label: "Оплачен", color: "success" },
  REFUNDED: { label: "Возврат", color: "error" },
  PARTIALLY_PAID: { label: "Частично оплачено", color: "info" },
};

const ViewOrderModal: React.FC<ViewOrderModalProps> = ({
  isOpen,
  onClose,
  order,
  isLoading = false,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('kk-KZ', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
    }).format(price ?? 0);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const { itemsTotal, deliveryFee } = useMemo(() => {
    if (!order) {
      return {
        itemsTotal: 0,
        deliveryFee: 0,
      };
    }

    const total = (order.items ?? []).reduce((acc, item) => {
      const unitPrice = typeof item.price === "number" ? item.price : Number(item.price ?? 0);
      const rawTotal = item.total ?? unitPrice * item.quantity;
      const safeTotal = Number.isFinite(rawTotal) ? rawTotal : 0;
      return acc + safeTotal;
    }, 0);
    const delivery = Math.max((order.totalAmount ?? 0) - total, 0);
    return {
      itemsTotal: total,
      deliveryFee: delivery,
    };
  }, [order]);

  if (!order) return null;

  const statusMeta = orderStatusMeta[order.status as OrderStatus] ?? {
    label: order.status,
    color: "primary",
  };

  const paymentMeta = paymentStatusMeta[order.paymentStatus as PaymentStatus] ?? {
    label: order.paymentStatus,
    color: "warning",
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Детали заказа {order.code || `ORD-${order.id.toString().padStart(6, '0')}`}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Создан {formatDateTime(order.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge
              size="sm"
              color={statusMeta.color as any}
            >
              {statusMeta.label}
            </Badge>
            <Badge
              size="sm"
              color={paymentMeta.color as any}
            >
              {paymentMeta.label}
            </Badge>
          </div>
        </div>

        {isLoading && (
          <div className="mb-4 rounded-lg border border-dashed border-brand-200 bg-brand-50/60 px-4 py-3 text-sm text-brand-700 dark:border-brand-900/60 dark:bg-brand-900/20 dark:text-brand-200">
            Загрузка актуальных данных заказа...
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Details */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                Информация о клиенте
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Имя:</span>
                  <span className="ml-2 text-sm text-gray-900 dark:text-white">
                    {order.customerName || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Email:</span>
                  <span className="ml-2 text-sm text-gray-900 dark:text-white">
                    {order.customerEmail || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Телефон:</span>
                  <span className="ml-2 text-sm text-gray-900 dark:text-white">
                    {order.customerPhone || '—'}
                  </span>
                </div>
                {order.deliveryAddress && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Адрес:</span>
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                      {order.deliveryAddress}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                Товары в заказе
              </h3>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    <div className="col-span-6">Товар</div>
                    <div className="col-span-2 text-center">Цена</div>
                    <div className="col-span-2 text-center">Кол-во</div>
                    <div className="col-span-2 text-right">Сумма</div>
                  </div>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {(order.items && order.items.length > 0) ? (
                    order.items.map((item) => (
                      <div key={item.id} className="px-4 py-3">
                        <div className="grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-6">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {item.productName || '—'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {item.sku ? `SKU: ${item.sku}` : item.productCode ? `Код: ${item.productCode}` : '—'}
                              </p>
                            </div>
                          </div>
                          <div className="col-span-2 text-center text-sm text-gray-900 dark:text-white">
                            {formatPrice(item.price ?? 0)}
                          </div>
                          <div className="col-span-2 text-center text-sm text-gray-900 dark:text-white">
                            {item.quantity}
                          </div>
                          <div className="col-span-2 text-right text-sm font-medium text-gray-900 dark:text-white">
                            {formatPrice((item.total ?? (item.price ?? 0) * item.quantity) ?? 0)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <p className="text-gray-500 dark:text-gray-400">
                        Информация о товарах недоступна
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                Сводка заказа
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Подытог:</span>
                  <span className="text-gray-900 dark:text-white">
                    {formatPrice(itemsTotal)}
                  </span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Доставка:</span>
                    <span className="text-gray-900 dark:text-white">
                      {formatPrice(deliveryFee)}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900 dark:text-white">Итого:</span>
                    <span className="font-bold text-lg text-gray-900 dark:text-white">
                      {formatPrice(order.totalAmount || itemsTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                Платежная информация
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Метод оплаты:</span>
                  <span className="ml-2 text-sm text-gray-900 dark:text-white">
                    —
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Статус оплаты:</span>
                  <span className="ml-2">
                    <Badge
                      size="sm"
                      color={paymentMeta.color as any}
                    >
                      {paymentMeta.label}
                    </Badge>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Закрыть
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ViewOrderModal;
