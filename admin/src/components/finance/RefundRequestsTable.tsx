"use client";
import React, { useEffect, useMemo, useState } from "react";
import Badge from "../ui/badge/Badge";
import Pagination from "../ui/pagination/Pagination";
import { financeApi, RefundRequest } from "@/lib/api/finance";

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

const formatCurrency = (amount?: number | null) =>
  new Intl.NumberFormat("kk-KZ", {
    style: "currency",
    currency: "KZT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount ?? 0);

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("ru-RU", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

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

  const itemsPerPage = 10;

  useEffect(() => {
    loadRefunds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, refreshKey]);

  const loadRefunds = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = (refund: RefundRequest) => {
    onProcessRefund(refund);
  };

  const handleReject = async (refund: RefundRequest) => {
    try {
      setLoading(true);
      await financeApi.updateRefundStatus(refund.id, { status: "REJECTED" });
      await loadRefunds();
    } catch (error) {
      console.error("Не удалось обновить статус возврата", error);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Запросы на возврат</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Управляйте заявками клиентов на возврат средств
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Всего заявок: {totalElements}
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Поиск
          </label>
          <input
            type="text"
            placeholder="ID возврата, клиента или заказа"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div className="w-full sm:w-52">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Статус
          </label>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[960px]">
            <table className="w-full">
              <thead className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/70 dark:bg-white/[0.03]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="px-5 py-3">Заявка</th>
                  <th className="px-5 py-3">Клиент</th>
                  <th className="px-5 py-3">Заказ</th>
                  <th className="px-5 py-3">Сумма</th>
                  <th className="px-5 py-3">Статус</th>
                  <th className="px-5 py-3">Создана</th>
                  <th className="px-5 py-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-6 text-center text-gray-500 dark:text-gray-400">
                      Загрузка данных…
                    </td>
                  </tr>
                ) : visibleRefunds.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-6 text-center text-gray-500 dark:text-gray-400">
                      Запросов не найдено
                    </td>
                  </tr>
                ) : (
                  visibleRefunds.map((refund) => {
                    const status = resolveStatusMeta(refund.status);
                    return (
                      <tr key={refund.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                        <td className="px-5 py-4 align-top">
                          <div className="font-semibold text-gray-900 dark:text-white">#{refund.id}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Client ID: {refund.clientId ?? refund.userId}</div>
                        </td>
                        <td className="px-5 py-4 align-top text-sm text-gray-600 dark:text-gray-300">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {refund.clientName || `Клиент #${refund.clientId ?? refund.userId ?? "—"}`}
                          </div>
                          {(refund.clientEmail || refund.clientPhone) && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {[refund.clientEmail, refund.clientPhone].filter(Boolean).join(" • ") || "—"}
                            </div>
                          )}
                          {refund.reason && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2" title={refund.reason}>
                              {refund.reason}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 align-top text-sm text-gray-600 dark:text-gray-300">
                          {refund.orderId ? `#${refund.orderId}` : "—"}
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(refund.amount)}
                          </div>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <Badge color={status.color}>{status.label}</Badge>
                        </td>
                        <td className="px-5 py-4 align-top text-sm text-gray-600 dark:text-gray-300">
                          {formatDateTime(refund.createdAt)}
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onViewRefund(refund)}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                              title="Просмотр"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/>
                                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                            </button>
                            {(refund.status === "NEW" || refund.status === "IN_REVIEW") && (
                              <>
                                <button
                                  onClick={() => handleProcess(refund)}
                                  className="px-3 py-2 text-xs font-semibold text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-300"
                                >
                                  Изменить статус
                                </button>
                                <button
                                  onClick={() => handleReject(refund)}
                                  className="px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-300"
                                >
                                  Отклонить
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
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
