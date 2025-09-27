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

interface OrdersTableProps {
  onViewOrder?: (order: ApiOrder) => void;
  onEditOrder?: (order: ApiOrder) => void;
  refreshToken?: string;
}

const orderStatusMeta: Record<OrderStatus, { label: string; color: string }> = {
  PENDING: { label: "Новый", color: "info" },
  CONFIRMED: { label: "Подтвержден", color: "primary" },
  CANCELLED: { label: "Отменен", color: "error" },
};

const paymentStatusMeta: Record<PaymentStatus, { label: string; color: string }> = {
  UNPAID: { label: "Ожидает оплаты", color: "warning" },
  PAID: { label: "Оплачен", color: "success" },
  REFUNDED: { label: "Возврат", color: "error" },
  PARTIALLY_PAID: { label: "Частично оплачено", color: "info" },
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('kk-KZ', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
    }).format(price ?? 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const resolveOrderStatus = (status: OrderStatus | string) => {
    return orderStatusMeta[status as OrderStatus] ?? { label: status, color: "info" };
  };

  const resolvePaymentStatus = (status: PaymentStatus | string) => {
    return paymentStatusMeta[status as PaymentStatus] ?? { label: status, color: "warning" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[1200px]">
          <Table>
            {/* Table Header */}
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Заказ
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Клиент
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Товары
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Сумма
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Статус
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Оплата
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Дата
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Действия
                </TableCell>
              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {error ? (
                <TableRow>
                  <TableCell className="px-5 py-4 text-center text-red-600" colSpan={8}>
                    Ошибка: {error}
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell className="px-5 py-4 text-center" colSpan={8}>
                    Нет заказов
                  </TableCell>
                </TableRow>
              ) : orders.map((order) => {
                const statusMeta = resolveOrderStatus(order.status);
                const paymentMeta = resolvePaymentStatus(order.paymentStatus);
                const orderNumber = order.code || `ORD-${order.id.toString().padStart(6, '0')}`;
                const customerName = order.customerName || order.customerEmail || `ID ${order.userId ?? '-'}`;
                const customerEmail = order.customerEmail || '—';
                const customerPhone = order.customerPhone || '';
                const itemsCount = order.items?.length ?? 0;
                const totalAmount = order.totalAmount ?? 0;

                return (
                  <TableRow key={order.id}>
                    <TableCell className="px-5 py-4 text-start">
                      <div>
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {orderNumber}
                        </span>
                        <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                          ID: {order.id}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start">
                      <div>
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {customerName}
                        </span>
                        <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                          {customerEmail}
                        </span>
                        {customerPhone && (
                          <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                            {customerPhone}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-700 text-start text-theme-sm dark:text-gray-300">
                      {itemsCount} шт.
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-700 text-start text-theme-sm dark:text-gray-300 font-medium">
                      {formatPrice(totalAmount)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start text-theme-sm">
                      <Badge size="sm" color={statusMeta.color as any}>
                        {statusMeta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start text-theme-sm">
                      <Badge size="sm" color={paymentMeta.color as any}>
                        {paymentMeta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onViewOrder?.(order)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                          title="Просмотр"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <circle
                              cx="12"
                              cy="12"
                              r="3"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => onEditOrder?.(order)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors dark:hover:bg-green-900/20 dark:hover:text-green-400"
                          title="Изменить статус"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
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
      
      {/* Pagination */}
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
