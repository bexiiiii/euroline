"use client";
import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import Pagination from "../ui/pagination/Pagination";
import { ordersApi, Order as ApiOrder, OrderStatus, PaymentStatus } from "@/lib/api/orders";
import { formatKzt } from "@/lib/format";

type BadgeColor = "primary" | "success" | "error" | "warning" | "info" | "light" | "dark";

const TH = "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400";
const TD = "px-4 py-3 text-sm text-gray-700 dark:text-gray-300";
const ICON_BTN =
  "inline-flex size-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-gray-200";

interface OrdersTableProps {
  onViewOrder?: (order: ApiOrder) => void;
  onEditOrder?: (order: ApiOrder) => void;
  refreshToken?: string;
}

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

const OrdersTable: React.FC<OrdersTableProps> = ({ onViewOrder, onEditOrder, refreshToken }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  const itemsPerPage = 10;

  useEffect(() => {
    loadOrders();
  }, [currentPage, refreshToken]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ordersApi.getOrders({
        page: currentPage - 1,
        size: itemsPerPage,
        sort: "createdAt,desc",
      });
      
      setOrders(response.content);
      setTotalElements(response.totalElements);
      setTotalPages(response.totalPages);
    } catch (e: any) {
      setError(e.message || "Не удалось загрузить заказы");
      setOrders([]);
      setTotalElements(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("ru-RU");
  };

  const resolveOrderStatus = (status: OrderStatus | string) => {
    return orderStatusMeta[status as OrderStatus] ?? { label: String(status), color: "light" as BadgeColor };
  };

  const resolvePaymentStatus = (status: PaymentStatus | string) => {
    return paymentStatusMeta[status as PaymentStatus] ?? { label: String(status), color: "light" as BadgeColor };
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="size-6 animate-spin rounded-full border-2 border-gray-200 border-t-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[820px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className={TH}>Заказ</TableCell>
                <TableCell isHeader className={TH}>Клиент</TableCell>
                <TableCell isHeader className={TH}>Позиций</TableCell>
                <TableCell isHeader className={TH}>Сумма</TableCell>
                <TableCell isHeader className={TH}>Статус</TableCell>
                <TableCell isHeader className={TH}>Оплата</TableCell>
                <TableCell isHeader className={`${TH} text-right`}>
                  <span className="sr-only">Действия</span>
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {error ? (
                <TableRow>
                  <TableCell className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400" colSpan={7}>
                    Не удалось загрузить данные.{" "}
                    <button
                      type="button"
                      onClick={() => loadOrders()}
                      className="font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
                    >
                      Повторить
                    </button>
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400" colSpan={7}>
                    Заказов пока нет
                  </TableCell>
                </TableRow>
              ) : orders.map((order) => {
                const statusMeta = resolveOrderStatus(order.status);
                const paymentMeta = resolvePaymentStatus(order.paymentStatus);
                const orderNumber = order.code || `№ ${order.id}`;
                const customerName = order.customerName || order.customerEmail || (order.userId ? `Клиент ${order.userId}` : "—");
                const customerContact = order.customerPhone || (order.customerName ? order.customerEmail : "") || "";
                const itemsCount = order.items?.length ?? 0;
                const totalAmount = order.totalAmount ?? 0;

                return (
                  <TableRow key={order.id}>
                    <TableCell className={TD}>
                      <span className="block font-medium text-gray-800 dark:text-white/90">{orderNumber}</span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">{formatDate(order.createdAt)}</span>
                    </TableCell>
                    <TableCell className={TD}>
                      <span className="block max-w-[240px] truncate text-gray-800 dark:text-white/90">{customerName}</span>
                      {customerContact && (
                        <span className="block max-w-[240px] truncate text-xs text-gray-500 dark:text-gray-400">{customerContact}</span>
                      )}
                    </TableCell>
                    <TableCell className={`${TD} tabular-nums`}>{itemsCount}</TableCell>
                    <TableCell className={`${TD} whitespace-nowrap font-medium tabular-nums`}>
                      {formatKzt(totalAmount)}
                    </TableCell>
                    <TableCell className={TD}>
                      <Badge size="sm" variant="light" color={statusMeta.color}>
                        {statusMeta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className={TD}>
                      <Badge size="sm" variant="light" color={paymentMeta.color}>
                        {paymentMeta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className={TD}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onViewOrder?.(order)}
                          className={ICON_BTN}
                          title="Просмотр"
                          aria-label={`Просмотр заказа ${orderNumber}`}
                        >
                          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditOrder?.(order)}
                          className={ICON_BTN}
                          title="Изменить статус"
                          aria-label={`Изменить статус заказа ${orderNumber}`}
                        >
                          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                          </svg>
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalItems={totalElements}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
};

export default OrdersTable;
