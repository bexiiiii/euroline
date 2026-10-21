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
import { formatKzt } from "@/lib/format";

type BadgeColor = "primary" | "success" | "error" | "warning" | "info" | "light" | "dark";

const TH = "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400";
const TD = "px-4 py-3 text-sm text-gray-700 dark:text-gray-300";
const ICON_BTN =
  "inline-flex size-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-gray-200";

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

const statusColors: Record<ReturnStatus, BadgeColor> = {
  NEW: "warning",
  PROCESSED: "info",
  APPROVED: "success",
  REJECTED: "error",
  REFUNDED: "light",
};

const PROCESSABLE_STATUSES: ReturnStatus[] = ["NEW", "PROCESSED"];

const formatDate = (dateString: string) =>
  dateString ? new Date(dateString).toLocaleDateString("ru-RU") : "—";

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

  const svgProps = {
    className: "size-4",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      {isInitialLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-gray-200 border-t-brand-500" />
        </div>
      ) : data.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Возвратов пока нет
        </div>
      ) : (
        <>
          {isRefreshing && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-gray-900/60">
              <div className="size-6 animate-spin rounded-full border-2 border-gray-200 border-t-brand-500" />
            </div>
          )}
          <div className="max-w-full overflow-x-auto">
            <div className="min-w-[720px]">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                  <TableRow>
                    <TableCell isHeader className={TH}>Возврат</TableCell>
                    <TableCell isHeader className={TH}>Клиент</TableCell>
                    <TableCell isHeader className={TH}>Сумма</TableCell>
                    <TableCell isHeader className={TH}>Статус</TableCell>
                    <TableCell isHeader className={TH}>Дата</TableCell>
                    <TableCell isHeader className={`${TH} text-right`}>
                      <span className="sr-only">Действия</span>
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className={TD}>
                        <span className="block font-medium text-gray-800 dark:text-white/90">{item.returnNumber}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                          Заказ {item.originalOrderNumber}
                        </span>
                      </TableCell>
                      <TableCell className={TD}>
                        <span className="block text-gray-800 dark:text-white/90">{item.customer.name}</span>
                        {item.customer.email && (
                          <span className="block text-xs text-gray-500 dark:text-gray-400">{item.customer.email}</span>
                        )}
                      </TableCell>
                      <TableCell className={`${TD} whitespace-nowrap font-medium tabular-nums`}>
                        {item.statusCode === "REJECTED" ? "—" : formatKzt(item.totalRefund)}
                      </TableCell>
                      <TableCell className={TD}>
                        <Badge size="sm" variant="light" color={statusColors[item.statusCode] ?? "light"}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className={`${TD} whitespace-nowrap text-gray-500 dark:text-gray-400`}>
                        {formatDate(item.requestDate)}
                      </TableCell>
                      <TableCell className={TD}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onViewReturn(item)}
                            className={ICON_BTN}
                            title="Просмотр"
                            aria-label={`Просмотр возврата ${item.returnNumber}`}
                          >
                            <svg {...svgProps}>
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                          {PROCESSABLE_STATUSES.includes(item.statusCode) && (
                            <button
                              type="button"
                              onClick={() => onProcessReturn(item)}
                              className={ICON_BTN}
                              title="Обработать"
                              aria-label={`Обработать возврат ${item.returnNumber}`}
                            >
                              <svg {...svgProps}>
                                <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

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
