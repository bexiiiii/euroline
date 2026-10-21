"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { analyticsApi, RecentOrderSummary } from "@/lib/api/analytics";
import { formatKzt } from "@/lib/format";
import WidgetError from "@/components/analytics/WidgetError";

type StatusColor = "primary" | "success" | "warning" | "error" | "info";

// Те же подписи, что и в разделе "Заказы" (components/orders/OrdersTable.tsx)
const orderStatusMeta: Record<string, { label: string; color: StatusColor }> = {
  PENDING: { label: "Новый", color: "info" },
  CONFIRMED: { label: "Подтвержден", color: "primary" },
  CANCELLED: { label: "Отменен", color: "error" },
};

const getStatusMeta = (status: string | null | undefined): { label: string; color: StatusColor } => {
  if (!status) return { label: "—", color: "info" };
  return orderStatusMeta[status.toUpperCase()] ?? { label: status, color: "info" };
};

export default function RecentOrders() {
  const [orders, setOrders] = useState<RecentOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyticsApi.getRecentOrders(5);
      setOrders(data);
    } catch (err) {
      console.error("Failed to fetch recent orders:", err);
      setError("Не удалось загрузить последние заказы");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="animate-pulse">
          <div className="h-5 w-32 rounded bg-gray-200 dark:bg-gray-800"></div>
          <div className="mt-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 rounded bg-gray-200 dark:bg-gray-800"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
          Последние заказы
        </h3>
        <Button asChild size="xs" variant="outline">
          <Link href="/orders">Все заказы</Link>
        </Button>
      </div>
      {error ? (
        <WidgetError message="Не удалось загрузить данные" onRetry={fetchOrders} />
      ) : (
      <div className="-mx-4 max-w-none overflow-x-auto">
        <Table>
          <TableHeader className="border-y border-gray-100 dark:border-gray-800">
            <TableRow>
              <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                Заказ
              </TableCell>
              <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                Товары
              </TableCell>
              <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                Сумма
              </TableCell>
              <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                Статус
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  Заказов пока нет
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white/90">
                        #{order.publicCode || order.id}
                      </p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {order.customerEmail}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    <div className="space-y-0.5">
                      {(order.items ?? []).slice(0, 2).map((item, idx) => (
                        <div key={idx}>
                          {item.productName} x{item.quantity}
                        </div>
                      ))}
                      {(order.items?.length ?? 0) > 2 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          +{(order.items?.length ?? 0) - 2} ещё
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm tabular-nums text-gray-700 dark:text-gray-300">
                    {formatKzt(order.totalPrice)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    <Badge variant="light" size="sm" color={getStatusMeta(order.status).color}>
                      {getStatusMeta(order.status).label}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      )}
    </div>
  );
}
