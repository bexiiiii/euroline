"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import Pagination from "../ui/pagination/Pagination";
import { ReturnStatus } from "@/lib/api/returns";

export type ReturnStatusLabel =
  | "Запрос на возврат"
  | "В обработке"
  | "Одобрен"
  | "Отклонен"
  | "Возврат завершен";

export interface ReturnTableItem {
  id: number;
  returnNumber: string;
  originalOrderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  totalRefund: number;
  status: ReturnStatusLabel;
  statusCode: ReturnStatus;
  returnType: string;
  requestDate: string;
  reason: string;
}

interface ReturnsTableProps {
  data: ReturnTableItem[];
  loading: boolean;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onViewReturn: (returnData: ReturnTableItem) => void;
  onProcessReturn: (returnData: ReturnTableItem) => void;
}

const statusColors: Record<ReturnStatus, string> = {
  NEW: "warning",
  PROCESSED: "info",
  APPROVED: "success",
  REJECTED: "error",
  REFUNDED: "dark",
};

const PROCESSABLE_STATUSES: ReturnStatus[] = ["NEW", "PROCESSED"];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "KZT",
    minimumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("ru-RU");

const ReturnsTable: React.FC<ReturnsTableProps> = ({
  data,
  loading,
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onViewReturn,
  onProcessReturn,
}) => {
  const isInitialLoading = loading && data.length === 0;
  const isRefreshing = loading && data.length > 0;

  return (
    <div className="space-y-4">
      <div className="relative overflow-x-auto bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        {isInitialLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3 text-gray-500 dark:text-gray-300">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-brand-500" />
              <span>Загрузка возвратов...</span>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">
            Возвраты не найдены
          </div>
        ) : (
          <>
            {isRefreshing && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/70 dark:bg-gray-900/70">
                <div className="flex items-center gap-3 text-gray-500 dark:text-gray-300">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-brand-500" />
                  <span>Обновление...</span>
                </div>
              </div>
            )}
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-gray-800">
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    Возврат
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    Клиент
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    Сумма возврата
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    Статус
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    Тип
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    Дата запроса
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    Действия
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
                {data.map((item) => (
                  <TableRow
                    key={item.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.returnNumber}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Заказ: {item.originalOrderNumber}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.customer.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {item.customer.email || "—"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.statusCode === "REJECTED"
                          ? "—"
                          : formatCurrency(item.totalRefund)}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        size="sm"
                        color={statusColors[item.statusCode] as any}
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <Badge size="sm" color="info">
                        {item.returnType}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatDate(item.requestDate)}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onViewReturn(item)}
                          className="text-blue-600 transition-colors hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Просмотр"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </button>
                        {PROCESSABLE_STATUSES.includes(item.statusCode) && (
                          <button
                            onClick={() => onProcessReturn(item)}
                            className="text-green-600 transition-colors hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            title="Обработать"
                          >
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          totalItems={totalItems}
          itemsPerPage={pageSize}
        />
      )}
    </div>
  );
};

export default ReturnsTable;
