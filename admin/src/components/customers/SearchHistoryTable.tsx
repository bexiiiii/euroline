"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Pagination from "../ui/pagination/Pagination";
import Button from "../ui/button/Button";
import { customersApi, CustomerSearchHistory } from "@/lib/api/customers";
import { formatDateTime } from "@/lib/format";

const TH = "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400";
const TD = "px-4 py-3 text-sm text-gray-700 dark:text-gray-300";
const CONTROL =
  "h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

interface SearchHistoryTableProps {
  refreshKey?: number;
  /** Кнопки справа в строке фильтров */
  actions?: React.ReactNode;
}

const SearchHistoryTable: React.FC<SearchHistoryTableProps> = ({ refreshKey, actions }) => {
  const [history, setHistory] = useState<CustomerSearchHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [customerIdFilter, setCustomerIdFilter] = useState<string>("");
  const [submittedCustomerId, setSubmittedCustomerId] = useState<number | undefined>(undefined);
  const [queryFilter, setQueryFilter] = useState("");
  const [pendingQueryFilter, setPendingQueryFilter] = useState("");

  const itemsPerPage = 10;

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customersApi.getSearchHistory({
        customerId: submittedCustomerId,
        page: currentPage - 1,
        size: itemsPerPage,
      });
      setHistory(response.content ?? []);
      setTotalPages(response.totalPages ?? 0);
      setTotalItems(response.totalElements ?? 0);
    } catch (e) {
      setHistory([]);
      setTotalPages(0);
      setTotalItems(0);
      setError(e instanceof Error ? e.message : 'Не удалось загрузить историю поиска');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, submittedCustomerId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, refreshKey]);

  const filteredHistory = useMemo(() => {
    if (!queryFilter.trim()) return history;
    const lower = queryFilter.trim().toLowerCase();
    return history.filter((item) => item.query.toLowerCase().includes(lower));
  }, [history, queryFilter]);

  const applyFilters = () => {
    setQueryFilter(pendingQueryFilter.trim());
    const raw = customerIdFilter.trim();
    if (!raw) {
      setSubmittedCustomerId(undefined);
      setCurrentPage(1);
      return;
    }
    const parsed = Number(raw);
    if (!Number.isNaN(parsed)) {
      setSubmittedCustomerId(parsed);
      setCurrentPage(1);
    }
  };

  const onEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyFilters();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="search-history-query" className="sr-only">
          Запрос
        </label>
        <input
          id="search-history-query"
          type="search"
          placeholder="Запрос"
          value={pendingQueryFilter}
          onChange={(e) => setPendingQueryFilter(e.target.value)}
          onKeyDown={onEnter}
          className={`${CONTROL} w-full sm:w-64`}
        />
        <label htmlFor="search-history-customer" className="sr-only">
          ID клиента
        </label>
        <input
          id="search-history-customer"
          inputMode="numeric"
          placeholder="ID клиента"
          value={customerIdFilter}
          onChange={(e) => setCustomerIdFilter(e.target.value)}
          onKeyDown={onEnter}
          className={`${CONTROL} w-full sm:w-36`}
        />
        <Button size="sm" variant="outline" className="h-10 py-0" onClick={applyFilters}>
          Применить
        </Button>
        {actions && <div className="ml-auto">{actions}</div>}
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-error-50 px-4 py-2.5 text-sm text-error-600 dark:bg-error-500/15 dark:text-error-500">
          <span>Не удалось загрузить данные</span>
          <button type="button" onClick={() => fetchHistory()} className="font-medium underline">
            Повторить
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table className="min-w-[640px]">
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className={TH}>Запрос</TableCell>
                <TableCell isHeader className={TH}>Клиент</TableCell>
                <TableCell isHeader className={TH}>Дата</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="px-4 py-10 text-center">
                    <div className="mx-auto size-6 animate-spin rounded-full border-2 border-gray-200 border-t-brand-500" />
                  </TableCell>
                </TableRow>
              ) : filteredHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    {queryFilter || submittedCustomerId !== undefined ? "Ничего не найдено" : "Запросов пока нет"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className={`${TD} font-medium text-gray-800 dark:text-white/90`}>
                      {item.query}
                    </TableCell>
                    <TableCell className={TD}>
                      {item.clientName?.trim() || (item.customerId ? `Клиент ${item.customerId}` : "—")}
                    </TableCell>
                    <TableCell className={`${TD} whitespace-nowrap text-gray-500 dark:text-gray-400`}>
                      {item.createdAt ? formatDateTime(item.createdAt) : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default SearchHistoryTable;
