"use client";
import React, { useEffect, useMemo, useState } from "react";
import Badge from "../ui/badge/Badge";
import Pagination from "../ui/pagination/Pagination";
import { financeApi, TopUpResponse } from "@/lib/api/finance";

interface BalanceTopUpTableProps {
  onTopUpBalance: (data: TopUpResponse) => void;
  refreshKey?: number;
}

const statusMeta: Record<string, { label: string; color: React.ComponentProps<typeof Badge>["color"] }> = {
  PENDING: { label: "Ожидает", color: "warning" },
  APPROVED: { label: "Одобрен", color: "success" },
  REJECTED: { label: "Отклонён", color: "error" },
  PROCESSING: { label: "В обработке", color: "info" },
};

const statusOptions = [
  { value: "", label: "Все статусы" },
  { value: "PENDING", label: "Ожидает" },
  { value: "APPROVED", label: "Одобрен" },
  { value: "REJECTED", label: "Отклонён" },
];

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("kk-KZ", {
    style: "currency",
    currency: "KZT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("ru-RU", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const resolveStatusMeta = (status?: string) => {
  if (!status) return { label: status ?? "—", color: "light" as const };
  return statusMeta[status] ?? { label: status, color: "light" as const };
};

const BalanceTopUpTable: React.FC<BalanceTopUpTableProps> = ({ onTopUpBalance, refreshKey }) => {
  const [topUps, setTopUps] = useState<TopUpResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const itemsPerPage = 10;

  useEffect(() => {
    loadTopUps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, refreshKey]);

  const loadTopUps = async () => {
    try {
      setLoading(true);
      const response = await financeApi.getTopUps(
        statusFilter || undefined,
        currentPage - 1,
        itemsPerPage
      );
      setTopUps(response.content ?? []);
      setTotalPages(response.totalPages ?? 1);
      setTotalElements(response.totalElements ?? 0);
    } catch (error) {
      console.error("Не удалось загрузить пополнения:", error);
      setTopUps([]);
      setTotalPages(1);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (topUp: TopUpResponse) => {
    try {
      const fresh = await financeApi.getTopUp(topUp.id);
      onTopUpBalance(fresh);
    } catch (error) {
      console.warn("Не удалось получить детали пополнения, используем кэш:", error);
      onTopUpBalance(topUp);
    }
  };

  const visibleTopUps = useMemo(() => {
    if (!searchTerm.trim()) return topUps;
    const term = searchTerm.trim().toLowerCase();
    return topUps.filter((topUp) => {
      const name = topUp.clientName?.toLowerCase() ?? "";
      const email = topUp.clientEmail?.toLowerCase() ?? "";
      const phone = topUp.clientPhone?.toLowerCase() ?? "";
      const idMatch = `#${topUp.id}`.toLowerCase();
      const clientIdMatch = `${topUp.clientId}`.toLowerCase();
      return (
        name.includes(term) ||
        email.includes(term) ||
        phone.includes(term) ||
        idMatch.includes(term) ||
        clientIdMatch.includes(term)
      );
    });
  }, [topUps, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Заявки на пополнение</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Управляйте поступившими запросами на пополнение баланса клиентов
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
            placeholder="Имя, email, телефон или ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div className="w-full sm:w-52">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Статус
          </label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setCurrentPage(1);
              setStatusFilter(e.target.value);
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
                  <th className="px-5 py-3">Сумма</th>
                  <th className="px-5 py-3">Способ</th>
                  <th className="px-5 py-3">Статус</th>
                  <th className="px-5 py-3">Дата</th>
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
                ) : visibleTopUps.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-6 text-center text-gray-500 dark:text-gray-400">
                      Заявок не найдено
                    </td>
                  </tr>
                ) : (
                  visibleTopUps.map((topUp) => {
                    const status = resolveStatusMeta(topUp.status);
                    return (
                      <tr key={topUp.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                        <td className="px-5 py-4 align-top">
                          <div className="font-semibold text-gray-900 dark:text-white">#{topUp.id}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Client ID: {topUp.clientId}</div>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {topUp.clientName || '—'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {topUp.clientEmail || '—'}
                          </div>
                          {topUp.clientPhone && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">{topUp.clientPhone}</div>
                          )}
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {formatAmount(topUp.amount)}
                          </div>
                        </td>
                        <td className="px-5 py-4 align-top text-sm text-gray-600 dark:text-gray-300">
                          {topUp.paymentMethod || 'Не указан'}
                        </td>
                        <td className="px-5 py-4 align-top">
                          <Badge color={status.color}>{status.label}</Badge>
                        </td>
                        <td className="px-5 py-4 align-top text-sm text-gray-600 dark:text-gray-300">
                          {formatDateTime(topUp.createdAt)}
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleView(topUp)}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                              title="Просмотр"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/>
                                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                            </button>
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

export default BalanceTopUpTable;
