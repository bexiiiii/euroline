"use client";
import React, { useEffect, useMemo, useState } from "react";
import Badge from "../ui/badge/Badge";
import Pagination from "../ui/pagination/Pagination";
import { financeApi, RefundRequest } from "@/lib/api/finance";
import { formatDateTime, formatKzt } from "@/lib/format";
import { useToast } from "@/context/ToastContext";
import FinanceLoadError from "./FinanceLoadError";
import {
  EditIcon,
  RejectIcon,
  RowAction,
  ViewIcon,
  controlClass,
  rowClass,
  tableWrapClass,
  tbodyClass,
  tdClass,
  thClass,
  theadClass,
} from "./tableUi";

interface RefundRequestsTableProps {
  onProcessRefund: (data: RefundRequest) => void;
  onViewRefund: (data: RefundRequest) => void;
  refreshKey?: number;
}

const statusMeta: Record<string, { label: string; color: React.ComponentProps<typeof Badge>["color"] }> = {
  NEW: { label: "В ожидании", color: "warning" },
  IN_REVIEW: { label: "На рассмотрении", color: "info" },
  APPROVED: { label: "Принят", color: "success" },
  REJECTED: { label: "Отклонён", color: "error" },
  DONE: { label: "Выплачен", color: "dark" },
};

const statusOptions = [
  { value: "", label: "Все статусы" },
  { value: "NEW", label: "В ожидании" },
  { value: "IN_REVIEW", label: "На рассмотрении" },
  { value: "APPROVED", label: "Принят" },
  { value: "REJECTED", label: "Отклонён" },
  { value: "DONE", label: "Выплачен" },
];

const resolveStatusMeta = (status?: string) => {
  if (!status) return { label: "—", color: "light" as const };
  return statusMeta[status] ?? { label: status, color: "light" as const };
};

const RefundRequestsTable: React.FC<RefundRequestsTableProps> = ({
  onProcessRefund,
  onViewRefund,
  refreshKey,
}) => {
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const itemsPerPage = 10;

  useEffect(() => {
    loadRefunds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, refreshKey]);

  const loadRefunds = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await financeApi.getRefundRequests(
        statusFilter || undefined,
        currentPage - 1,
        itemsPerPage
      );

      setRefunds(response.content ?? []);
      setTotalPages(response.totalPages ?? 1);
      setTotalElements(response.totalElements ?? 0);
    } catch (error) {
      console.error("Не удалось загрузить запросы на возврат:", error);
      setRefunds([]);
      setTotalPages(1);
      setTotalElements(0);
      setError("Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = (refund: RefundRequest) => {
    onProcessRefund(refund);
  };

  const handleReject = async (refund: RefundRequest) => {
    if (!window.confirm(`Отклонить заявку на возврат #${refund.id}?`)) {
      return;
    }
    try {
      setLoading(true);
      await financeApi.updateRefundStatus(refund.id, { status: "REJECTED" });
      toast.success(`Заявка #${refund.id} отклонена`);
      await loadRefunds();
    } catch (error) {
      console.error("Не удалось обновить статус возврата", error);
      toast.error("Не удалось отклонить заявку на возврат");
    } finally {
      setLoading(false);
    }
  };

  const visibleRefunds = useMemo(() => {
    if (!searchTerm.trim()) return refunds;
    const term = searchTerm.trim().toLowerCase();
    return refunds.filter((refund) => {
      const idMatch = `#${refund.id}`.toLowerCase();
      const clientMatch = `${refund.clientId ?? refund.userId ?? ""}`.toLowerCase();
      const orderMatch = refund.orderId ? `#${refund.orderId}`.toLowerCase() : "";
      return idMatch.includes(term) || clientMatch.includes(term) || orderMatch.includes(term);
    });
  }, [refunds, searchTerm]);

  const stateRow = (text: string) => (
    <tr>
      <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        {text}
      </td>
    </tr>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="ID возврата, клиента или заказа"
          aria-label="Поиск по ID возврата, клиента или заказа"
          value={searchTerm}
          onChange={(event) => {
            setSearchTerm(event.target.value);
            setCurrentPage(1);
          }}
          className={`${controlClass} min-w-[220px] flex-1`}
        />
        <select
          aria-label="Фильтр по статусу"
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setCurrentPage(1);
          }}
          className={`${controlClass} w-full sm:w-48`}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="text-sm tabular-nums text-gray-500 dark:text-gray-400">Всего: {totalElements}</span>
      </div>

      {error && <FinanceLoadError message={error} onRetry={loadRefunds} />}

      <div className={tableWrapClass}>
        <table className="w-full min-w-[800px]">
          <thead className={theadClass}>
            <tr>
              <th className={thClass}>Заявка</th>
              <th className={thClass}>Клиент</th>
              <th className={thClass}>Сумма</th>
              <th className={thClass}>Статус</th>
              <th className={thClass}>Создана</th>
              <th className={`${thClass} text-right`}>Действия</th>
            </tr>
          </thead>
          <tbody className={tbodyClass}>
            {loading
              ? stateRow("Загрузка…")
              : error
                ? stateRow("Данные недоступны")
                : visibleRefunds.length === 0
                  ? stateRow("Запросов нет")
                  : visibleRefunds.map((refund) => {
                      const status = resolveStatusMeta(refund.status);
                      const canProcess = refund.status === "NEW" || refund.status === "IN_REVIEW";
                      return (
                        <tr key={refund.id} className={rowClass}>
                          <td className={tdClass}>
                            <div className="font-medium text-gray-800 dark:text-white/90">#{refund.id}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {refund.orderId ? `Заказ #${refund.orderId}` : "Без заказа"}
                            </div>
                          </td>
                          <td className={tdClass}>
                            <div className="font-medium text-gray-800 dark:text-white/90">
                              {refund.clientName || `Клиент #${refund.clientId ?? refund.userId ?? "—"}`}
                            </div>
                            {refund.reason && (
                              <div className="line-clamp-1 max-w-xs text-xs text-gray-500 dark:text-gray-400" title={refund.reason}>
                                {refund.reason}
                              </div>
                            )}
                          </td>
                          <td className={`${tdClass} font-medium tabular-nums text-gray-800 dark:text-white/90`}>
                            {formatKzt(refund.amount)}
                          </td>
                          <td className={tdClass}>
                            <Badge size="sm" color={status.color}>{status.label}</Badge>
                          </td>
                          <td className={`${tdClass} whitespace-nowrap tabular-nums`}>{formatDateTime(refund.createdAt)}</td>
                          <td className={tdClass}>
                            <div className="flex items-center justify-end gap-1">
                              <RowAction label={`Просмотреть заявку #${refund.id}`} onClick={() => onViewRefund(refund)}>
                                <ViewIcon />
                              </RowAction>
                              {canProcess && (
                                <>
                                  <RowAction label={`Изменить статус заявки #${refund.id}`} onClick={() => handleProcess(refund)}>
                                    <EditIcon />
                                  </RowAction>
                                  <RowAction label={`Отклонить заявку #${refund.id}`} onClick={() => handleReject(refund)} destructive>
                                    <RejectIcon />
                                  </RowAction>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalElements}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default RefundRequestsTable;
