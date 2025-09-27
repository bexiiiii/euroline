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
import Input from "../form/input/InputField";
import { customersApi, CustomerSearchHistory } from "@/lib/api/customers";

interface SearchHistoryTableProps {
  refreshKey?: number;
}

const SearchHistoryTable: React.FC<SearchHistoryTableProps> = ({ refreshKey }) => {
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

  const handleCustomerFilter = () => {
    if (!customerIdFilter.trim()) {
      setSubmittedCustomerId(undefined);
      setCurrentPage(1);
      return;
    }
    const parsed = Number(customerIdFilter.trim());
    if (!Number.isNaN(parsed)) {
      setSubmittedCustomerId(parsed);
      setCurrentPage(1);
    }
  };

  const handleQueryFilter = () => {
    setQueryFilter(pendingQueryFilter.trim());
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          <div className="sm:w-48">
            <Input
              placeholder="ID клиента"
              value={customerIdFilter}
              onChange={(e) => setCustomerIdFilter(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCustomerFilter();
                }
              }}
            />
          </div>
          <button
            onClick={handleCustomerFilter}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Фильтр по клиенту
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          <div className="sm:w-64">
            <Input
              placeholder="Фильтр по запросу"
              value={pendingQueryFilter}
              onChange={(e) => setPendingQueryFilter(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleQueryFilter();
                }
              }}
            />
          </div>
          <button
            onClick={handleQueryFilter}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Применить
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-10 text-center text-gray-500">Загрузка истории поиска…</div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Запрос
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Имя заведения
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Создано
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="px-4 py-6 text-center text-gray-500">
                    История поиска не найдена
                  </TableCell>
                </TableRow>
              ) : (
                filteredHistory.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <TableCell className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {item.query}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {item.clientName?.trim() || (item.customerId ? `ID ${item.customerId}` : '—')}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString('ru-RU') : '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default SearchHistoryTable;
