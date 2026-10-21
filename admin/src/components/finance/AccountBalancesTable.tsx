"use client";
import React, { useEffect, useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import Pagination from "@/components/ui/pagination/Pagination";
import { financeApi, ClientBalance } from "@/lib/api/finance";
import { formatDateTime, formatKzt } from "@/lib/format";
import FinanceLoadError from "./FinanceLoadError";
import {
  EditIcon,
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

interface AccountBalancesTableProps {
  onViewBalance: (data: ClientBalance) => void;
  onAdjustBalance: (data: ClientBalance) => void;
  refreshKey?: number;
}

const AccountBalancesTable: React.FC<AccountBalancesTableProps> = ({
  onViewBalance,
  onAdjustBalance,
  refreshKey = 0,
}) => {
  const [balances, setBalances] = useState<ClientBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const itemsPerPage = 10;

  useEffect(() => {
    loadBalances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, refreshKey]);

  const loadBalances = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await financeApi.getBalances(currentPage - 1, itemsPerPage);
      setBalances(response.content ?? []);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error("Не удалось загрузить балансы:", error);
      setBalances([]);
      setError("Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (balance: number) => {
    if (balance > 10000) return <Badge size="sm" color="success">Активный</Badge>;
    if (balance > 0) return <Badge size="sm" color="warning">Низкий баланс</Badge>;
    return <Badge size="sm" color="light">Нулевой баланс</Badge>;
  };

  const filteredData = balances.filter((balance) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return true;
    }

    const matchesId = balance.clientId.toString().includes(term);
    const matchesEstablishment = balance.establishmentName
      ? balance.establishmentName.toLowerCase().includes(term)
      : false;
    const matchesContactName = balance.contactName
      ? balance.contactName.toLowerCase().includes(term)
      : false;
    const matchesEmail = balance.email
      ? balance.email.toLowerCase().includes(term)
      : false;

    return matchesId || matchesEstablishment || matchesContactName || matchesEmail;
  });

  const getPrimaryTitle = (balance: ClientBalance) => {
    return (
      balance.establishmentName?.trim() ||
      balance.contactName?.trim() ||
      `Пользователь #${balance.clientId}`
    );
  };

  const getSecondaryTitle = (balance: ClientBalance) => {
    const primary = getPrimaryTitle(balance);
    const contact = balance.contactName?.trim();
    if (contact && contact !== primary) {
      return contact;
    }
    return `ID: ${balance.clientId}`;
  };

  const stateRow = (text: string) => (
    <tr>
      <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        {text}
      </td>
    </tr>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Клиент, email или ID"
          aria-label="Поиск по клиенту, email или ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`${controlClass} min-w-[220px] flex-1`}
        />
        <span className="text-sm tabular-nums text-gray-500 dark:text-gray-400">Всего: {totalElements}</span>
      </div>

      {error && <FinanceLoadError message={error} onRetry={loadBalances} />}

      <div className={tableWrapClass}>
        <table className="w-full min-w-[680px]">
          <thead className={theadClass}>
            <tr>
              <th className={thClass}>Клиент</th>
              <th className={thClass}>Баланс</th>
              <th className={thClass}>Статус</th>
              <th className={thClass}>Обновлен</th>
              <th className={`${thClass} text-right`}>Действия</th>
            </tr>
          </thead>
          <tbody className={tbodyClass}>
            {loading
              ? stateRow("Загрузка…")
              : error
                ? stateRow("Данные недоступны")
                : filteredData.length === 0
                  ? stateRow(searchTerm.trim() ? "Ничего не найдено" : "Счетов пока нет")
                  : filteredData.map((balance) => (
                      <tr key={balance.clientId} className={rowClass}>
                        <td className={tdClass}>
                          <div className="font-medium text-gray-800 dark:text-white/90">{getPrimaryTitle(balance)}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {[getSecondaryTitle(balance), balance.email].filter(Boolean).join(", ")}
                          </div>
                        </td>
                        <td className={`${tdClass} font-medium tabular-nums text-gray-800 dark:text-white/90`}>
                          {formatKzt(balance.balance)}
                        </td>
                        <td className={tdClass}>{getStatusBadge(balance.balance)}</td>
                        <td className={`${tdClass} whitespace-nowrap tabular-nums`}>{formatDateTime(balance.updatedAt)}</td>
                        <td className={tdClass}>
                          <div className="flex items-center justify-end gap-1">
                            <RowAction label={`Просмотреть баланс: ${getPrimaryTitle(balance)}`} onClick={() => onViewBalance(balance)}>
                              <ViewIcon />
                            </RowAction>
                            <RowAction label={`Скорректировать баланс: ${getPrimaryTitle(balance)}`} onClick={() => onAdjustBalance(balance)}>
                              <EditIcon />
                            </RowAction>
                          </div>
                        </td>
                      </tr>
                    ))}
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

export default AccountBalancesTable;
