"use client";
import React, { useEffect, useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import Pagination from "@/components/ui/pagination/Pagination";
import { financeApi, ClientBalance } from "@/lib/api/finance";

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

  const itemsPerPage = 10;

  useEffect(() => {
    loadBalances();
  }, [currentPage, refreshKey]);

  const loadBalances = async () => {
    try {
      setLoading(true);
      const response = await financeApi.getBalances(currentPage - 1, itemsPerPage);
      setBalances(response.content ?? []);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error("Не удалось загрузить балансы:", error);
      setBalances([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("kk-KZ", {
      style: "currency",
      currency: "KZT",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("ru-RU");
  };

  const getStatusBadge = (balance: number) => {
    if (balance > 10000) return <Badge color="success">Активный</Badge>;
    if (balance > 0) return <Badge color="warning">Низкий баланс</Badge>;
    return <Badge color="error">Нулевой баланс</Badge>;
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

  return (
    <div className="space-y-6">
      {/* Заголовок и поиск */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Балансы клиентов
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Управление балансами клиентских счетов
          </p>
        </div>
      </div>

      {/* Поиск */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Поиск по клиенту или ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
          Всего счетов: {totalElements}
        </div>
      </div>

      {/* Таблица */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[800px]">
            <table className="w-full">
              <thead className="border-b border-gray-100 dark:border-white/[0.05]">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Пользователь
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Баланс
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Обновлен
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {loading ? (
                  <tr>
                    <td className="px-5 py-4 text-center" colSpan={5}>
                      Загрузка...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td className="px-5 py-4 text-center" colSpan={5}>
                      Нет данных
                    </td>
                  </tr>
                ) : (
                  filteredData.map((balance) => (
                    <tr key={balance.clientId} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {getPrimaryTitle(balance)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-col sm:flex-row sm:items-center sm:gap-2">
                            <span>{getSecondaryTitle(balance)}</span>
                            <span className="hidden sm:inline text-gray-300 dark:text-gray-600">•</span>
                            <span>Обновлено: {formatDateTime(balance.updatedAt)}</span>
                          </div>
                          {balance.email && (
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              {balance.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(balance.balance)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {getStatusBadge(balance.balance)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDateTime(balance.updatedAt)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onViewBalance(balance)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                            title="Просмотр"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/>
                              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => onAdjustBalance(balance)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors dark:hover:bg-green-900/20 dark:hover:text-green-400"
                            title="Корректировка"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Пагинация */}
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
