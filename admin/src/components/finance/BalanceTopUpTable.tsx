"use client";
import React, { useEffect, useMemo, useState } from "react";
import Badge from "../ui/badge/Badge";
import Pagination from "../ui/pagination/Pagination";
import { financeApi, TopUpResponse } from "@/lib/api/finance";
import { formatDateTime, formatKzt } from "@/lib/format";
import FinanceLoadError from "./FinanceLoadError";
import {
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
  const [error, setError] = useState<string | null>(null);

  const itemsPerPage = 10;

  useEffect(() => {
    loadTopUps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, refreshKey]);

  const loadTopUps = async () => {
    try {
      setLoading(true);
      setError(null);
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
      setError("Не удалось загрузить данные");
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
          placeholder="Имя, email, телефон или ID"
          aria-label="Поиск по имени, email, телефону или ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`${controlClass} min-w-[220px] flex-1`}
        />
        <select
          aria-label="Фильтр по статусу"
          value={statusFilter}
          onChange={(e) => {
            setCurrentPage(1);
            setStatusFilter(e.target.value);
          }}
          className={`${controlClass} w-full sm:w-44`}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="text-sm tabular-nums text-gray-500 dark:text-gray-400">Всего: {totalElements}</span>
      </div>

      {error && <FinanceLoadError message={error} onRetry={loadTopUps} />}

      <div className={tableWrapClass}>
        <table className="w-full min-w-[760px]">
          <thead className={theadClass}>
            <tr>
              <th className={thClass}>Заявка</th>
              <th className={thClass}>Клиент</th>
              <th className={thClass}>Сумма</th>
              <th className={thClass}>Статус</th>
              <th className={thClass}>Дата</th>
              <th className={`${thClass} text-right`}>Действия</th>
            </tr>
          </thead>
          <tbody className={tbodyClass}>
            {loading
              ? stateRow("Загрузка…")
              : error
                ? stateRow("Данные недоступны")
                : visibleTopUps.length === 0
                  ? stateRow("Заявок нет")
                  : visibleTopUps.map((topUp) => {
                      const status = resolveStatusMeta(topUp.status);
                      return (
                        <tr key={topUp.id} className={rowClass}>
                          <td className={tdClass}>
                            <div className="font-medium text-gray-800 dark:text-white/90">#{topUp.id}</div>
                            {topUp.paymentMethod && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">{topUp.paymentMethod}</div>
                            )}
                          </td>
                          <td className={tdClass}>
                            <div className="font-medium text-gray-800 dark:text-white/90">
                              {topUp.clientName || `Клиент #${topUp.clientId}`}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {[topUp.clientEmail, topUp.clientPhone].filter(Boolean).join(", ") || "—"}
                            </div>
                          </td>
                          <td className={`${tdClass} font-medium tabular-nums text-gray-800 dark:text-white/90`}>
                            {formatKzt(topUp.amount)}
                          </td>
                          <td className={tdClass}>
                            <Badge size="sm" color={status.color}>{status.label}</Badge>
                          </td>
                          <td className={`${tdClass} whitespace-nowrap tabular-nums`}>{formatDateTime(topUp.createdAt)}</td>
                          <td className={`${tdClass} text-right`}>
                            <RowAction label={`Просмотреть заявку #${topUp.id}`} onClick={() => handleView(topUp)}>
                              <ViewIcon />
                            </RowAction>
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

export default BalanceTopUpTable;
