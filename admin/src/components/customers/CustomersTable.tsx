"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Badge from "../ui/badge/Badge";
import { Modal } from "../ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Pagination from "../ui/pagination/Pagination";
import Input from "../form/input/InputField";
import { customersApi, Customer } from "@/lib/api/customers";

interface CustomersTableProps {
  refreshKey?: number;
  onDataChanged?: () => void;
  onViewCustomer?: (customer: Customer) => void;
  onEditCustomer?: (customer: Customer) => void;
  onDeleteCustomer?: (customerId: number) => void;
}

const statusBadge = (banned: boolean) => {
  if (banned) {
    return {
      color: "error" as const,
      label: "Заблокирован",
    };
  }
  return {
    color: "success" as const,
    label: "Активен",
  };
};

const getDisplayName = (customer: Customer) => {
  if (customer.clientName && customer.clientName.trim()) return customer.clientName;
  const parts = [customer.surname, customer.name, customer.fathername]
    .filter((part) => part && part.trim().length > 0);
  if (parts.length > 0) return parts.join(" ");
  return customer.email;
};

const formatBrowser = (userAgent?: string | null) => {
  if (!userAgent) {
    return "—";
  }
  const trimmed = userAgent.trim();
  if (!trimmed || trimmed.toLowerCase() === "unknown") {
    return "—";
  }
  const uaLower = trimmed.toLowerCase();

  const getVersion = (marker: string) => {
    const index = trimmed.indexOf(marker);
    if (index === -1) {
      return "";
    }
    const version = trimmed
      .slice(index + marker.length)
      .split(/[\s;]/)[0]
      .replace(/[^0-9A-Za-z.]/g, "");
    return version;
  };

  const withVersion = (name: string, marker: string) => {
    const version = getVersion(marker);
    return version ? `${name} ${version}` : name;
  };

  if (uaLower.includes("yabrowser")) {
    return withVersion("Yandex Browser", "YaBrowser/");
  }
  if (uaLower.includes("edg/")) {
    return withVersion("Microsoft Edge", "Edg/");
  }
  if (uaLower.includes("vivaldi")) {
    return withVersion("Vivaldi", "Vivaldi/");
  }
  if (uaLower.includes("opr/") || uaLower.includes("opera")) {
    return withVersion("Opera", "OPR/");
  }
  if (uaLower.includes("brave")) {
    return withVersion("Brave", "Chrome/");
  }
  if (
    uaLower.includes("chrome") &&
    !uaLower.includes("chromium") &&
    !uaLower.includes("edg/") &&
    !uaLower.includes("opr/") &&
    !uaLower.includes("samsungbrowser")
  ) {
    return withVersion("Chrome", "Chrome/");
  }
  if (uaLower.includes("samsungbrowser")) {
    return withVersion("Samsung Browser", "SamsungBrowser/");
  }
  if (uaLower.includes("firefox")) {
    return withVersion("Firefox", "Firefox/");
  }
  if (uaLower.includes("safari") && !uaLower.includes("chrome")) {
    return withVersion("Safari", "Version/");
  }
  if (uaLower.includes("msie") || uaLower.includes("trident/")) {
    return "Internet Explorer";
  }

  return trimmed.length > 80 ? `${trimmed.slice(0, 77)}…` : trimmed;
};

const CustomersTable: React.FC<CustomersTableProps> = ({
  refreshKey,
  onDataChanged,
  onViewCustomer,
  onEditCustomer,
  onDeleteCustomer,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingSearch, setPendingSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'banned'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const itemsPerPage = 10;

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customersApi.getCustomers({
        page: currentPage - 1,
        size: itemsPerPage,
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        sort: 'id,desc',
      });
      setCustomers(response.content ?? []);
      setTotalPages(response.totalPages ?? 0);
      setTotalItems(response.totalElements ?? 0);
    } catch (e) {
      setCustomers([]);
      setTotalPages(0);
      setTotalItems(0);
      setError(e instanceof Error ? e.message : 'Не удалось загрузить клиентов');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, statusFilter]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers, refreshKey]);

  const handleSearchSubmit = () => {
    setCurrentPage(1);
    setSearchTerm(pendingSearch.trim());
  };

  const handleStatusChange = (value: 'all' | 'active' | 'banned') => {
    setCurrentPage(1);
    setStatusFilter(value);
  };

  const handleToggleStatus = async (customer: Customer) => {
    try {
      const nextStatus = customer.banned ? 'active' : 'banned';
      await customersApi.updateStatus(customer.id, nextStatus);
      onDataChanged?.();
      await loadCustomers();
    } catch (e) {
      console.error('Failed to update customer status', e);
      setError(e instanceof Error ? e.message : 'Не удалось обновить статус клиента');
    }
  };

  const handleDelete = async (customer: Customer) => {
    if (!window.confirm(`Удалить клиента ${getDisplayName(customer)}?`)) {
      return;
    }
    try {
      await customersApi.deleteCustomer(customer.id);
      onDeleteCustomer?.(customer.id);
      onDataChanged?.();
      await loadCustomers();
    } catch (e) {
      console.error('Failed to delete customer', e);
      setError(e instanceof Error ? e.message : 'Не удалось удалить клиента');
    }
  };

  const openViewModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setViewModalOpen(true);
    onViewCustomer?.(customer);
  };

  const closeViewModal = () => {
    setSelectedCustomer(null);
    setViewModalOpen(false);
  };

  const cardContent = useMemo(() => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <div className="w-full sm:w-64">
          <Input
            placeholder="Поиск по имени, email или телефону"
            value={pendingSearch}
            onChange={(e) => setPendingSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearchSubmit();
              }
            }}
          />
        </div>
        <button
          onClick={handleSearchSubmit}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Искать
        </button>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value as 'all' | 'active' | 'banned')}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-900 dark:border-gray-700 dark:text-white/90"
        >
          <option value="all">Все</option>
          <option value="active">Активные</option>
          <option value="banned">Заблокированные</option>
        </select>
      </div>
    </div>
  ), [pendingSearch, statusFilter]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        {cardContent}
        <div className="p-10 text-center text-gray-500">Загрузка клиентов…</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      {cardContent}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <Table className="min-w-[960px]">
          <TableHeader>
            <TableRow>
              <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Клиент
              </TableCell>
              <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Контакты
              </TableCell>
              <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Город
              </TableCell>
              <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </TableCell>
              <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Роль
              </TableCell>
              <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Браузер
              </TableCell>
              <TableCell isHeader className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  Клиенты не найдены
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => {
                const displayName = getDisplayName(customer);
                const badge = statusBadge(customer.banned);
                const browserDisplay = formatBrowser(customer.lastBrowser);
                return (
                  <TableRow key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <TableCell className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {displayName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">ID: {customer.id}</div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      <div>{customer.email}</div>
                      {customer.phone && <div className="text-xs text-gray-500 dark:text-gray-400">{customer.phone}</div>}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {customer.city || '—'}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge color={badge.color}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {customer.role}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {browserDisplay}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            openViewModal(customer);
                          }}
                          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Подробнее
                        </button>
                        <button
                          onClick={() => {
                            handleToggleStatus(customer);
                          }}
                          className="px-3 py-1 text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                        >
                          {customer.banned ? 'Разблокировать' : 'Заблокировать'}
                        </button>
                        <button
                          onClick={() => handleDelete(customer)}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Удалить
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
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

      {selectedCustomer && (
        <ViewCustomerModal
          isOpen={viewModalOpen}
          onClose={closeViewModal}
          customer={selectedCustomer}
          onEditCustomer={onEditCustomer}
        />
      )}
    </div>
  );
};

interface ViewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  onEditCustomer?: (customer: Customer) => void;
}

const ViewCustomerModal: React.FC<ViewCustomerModalProps> = ({
  isOpen,
  onClose,
  customer,
  onEditCustomer,
}) => {
  const badge = statusBadge(customer.banned);

  const handleEdit = () => {
    onEditCustomer?.(customer);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {getDisplayName(customer)}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">ID: {customer.id}</p>
          </div>
          <Badge color={badge.color}>{badge.label}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</p>
              <p className="text-sm text-gray-900 dark:text-white">{customer.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Телефон</p>
              <p className="text-sm text-gray-900 dark:text-white">{customer.phone || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Браузер</p>
              <p className="text-sm text-gray-900 dark:text-white">{formatBrowser(customer.lastBrowser)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Клиент</p>
              <p className="text-sm text-gray-900 dark:text-white">{customer.clientName || '—'}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Город</p>
              <p className="text-sm text-gray-900 dark:text-white">{customer.city || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Компания</p>
              <p className="text-sm text-gray-900 dark:text-white">{customer.officeAddress || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Роль</p>
              <p className="text-sm text-gray-900 dark:text-white">{customer.role}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Закрыть
          </button>
          <button
            onClick={handleEdit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Редактировать
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CustomersTable;
