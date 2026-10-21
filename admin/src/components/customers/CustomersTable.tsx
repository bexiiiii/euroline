"use client";

import React, { useCallback, useEffect, useState } from "react";
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
import Button from "../ui/button/Button";
import { customersApi, Customer } from "@/lib/api/customers";

const TH = "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400";
const TD = "px-4 py-3 text-sm text-gray-700 dark:text-gray-300";
const ICON_BTN =
  "inline-flex size-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-gray-200";
const ICON_BTN_DANGER =
  "inline-flex size-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-error-50 hover:text-error-600 dark:text-gray-400 dark:hover:bg-error-500/15 dark:hover:text-error-500";
const CONTROL =
  "h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

interface CustomersTableProps {
  refreshKey?: number;
  /** Кнопки справа в строке фильтров */
  actions?: React.ReactNode;
  onDataChanged?: () => void;
  onViewCustomer?: (customer: Customer) => void;
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

const ROLE_LABELS: Record<string, string> = {
  USER: "Клиент",
  ADMIN: "Администратор",
};

const formatRole = (role?: string | null) => {
  if (!role) return "—";
  return ROLE_LABELS[role.toUpperCase()] ?? role;
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
  actions,
  onDataChanged,
  onViewCustomer,
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="customers-search" className="sr-only">
          Поиск клиентов
        </label>
        <input
          id="customers-search"
          type="search"
          placeholder="Имя, эл. почта или телефон"
          value={pendingSearch}
          onChange={(e) => setPendingSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearchSubmit();
            }
          }}
          className={`${CONTROL} w-full sm:w-72`}
        />
        <Button size="sm" variant="outline" className="h-10 py-0" onClick={handleSearchSubmit}>
          Найти
        </Button>
        <select
          aria-label="Статус клиента"
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value as 'all' | 'active' | 'banned')}
          className={CONTROL}
        >
          <option value="all">Все статусы</option>
          <option value="active">Активные</option>
          <option value="banned">Заблокированные</option>
        </select>
        {actions && <div className="ml-auto">{actions}</div>}
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-error-50 px-4 py-2.5 text-sm text-error-600 dark:bg-error-500/15 dark:text-error-500">
          <span>{error}</span>
          <button type="button" onClick={() => loadCustomers()} className="font-medium underline">
            Повторить
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table className="min-w-[760px]">
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className={TH}>Клиент</TableCell>
                <TableCell isHeader className={TH}>Телефон</TableCell>
                <TableCell isHeader className={TH}>Город</TableCell>
                <TableCell isHeader className={TH}>Статус</TableCell>
                <TableCell isHeader className={`${TH} text-right`}>
                  <span className="sr-only">Действия</span>
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-4 py-10 text-center">
                    <div className="mx-auto size-6 animate-spin rounded-full border-2 border-gray-200 border-t-brand-500" />
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    {searchTerm || statusFilter !== "all" ? "Ничего не найдено" : "Клиентов пока нет"}
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => {
                  const displayName = getDisplayName(customer);
                  const badge = statusBadge(customer.banned);
                  const isAdmin = customer.role?.toUpperCase() === "ADMIN";
                  return (
                    <TableRow key={customer.id}>
                      <TableCell className={TD}>
                        <div className="flex items-center gap-2">
                          <span className="max-w-[260px] truncate font-medium text-gray-800 dark:text-white/90">
                            {displayName}
                          </span>
                          {isAdmin && (
                            <Badge size="sm" variant="light" color="light">Администратор</Badge>
                          )}
                        </div>
                        {displayName !== customer.email && (
                          <div className="max-w-[260px] truncate text-xs text-gray-500 dark:text-gray-400">{customer.email}</div>
                        )}
                      </TableCell>
                      <TableCell className={`${TD} whitespace-nowrap`}>{customer.phone || "—"}</TableCell>
                      <TableCell className={TD}>{customer.city || "—"}</TableCell>
                      <TableCell className={TD}>
                        <Badge size="sm" variant="light" color={badge.color}>{badge.label}</Badge>
                      </TableCell>
                      <TableCell className={TD}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openViewModal(customer)}
                            className={ICON_BTN}
                            title="Просмотр"
                            aria-label={`Просмотр клиента ${displayName}`}
                          >
                            <svg {...svgProps}>
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(customer)}
                            className={ICON_BTN}
                            title={customer.banned ? "Разблокировать" : "Заблокировать"}
                            aria-label={`${customer.banned ? "Разблокировать" : "Заблокировать"} клиента ${displayName}`}
                          >
                            {customer.banned ? (
                              <svg {...svgProps}>
                                <rect x="4" y="11" width="16" height="10" rx="2" />
                                <path d="M8 11V7a4 4 0 017.75-1.4" />
                              </svg>
                            ) : (
                              <svg {...svgProps}>
                                <rect x="4" y="11" width="16" height="10" rx="2" />
                                <path d="M8 11V7a4 4 0 018 0v4" />
                              </svg>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(customer)}
                            className={ICON_BTN_DANGER}
                            title="Удалить"
                            aria-label={`Удалить клиента ${displayName}`}
                          >
                            <svg {...svgProps}>
                              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                            </svg>
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
      </div>

      {selectedCustomer && (
        <ViewCustomerModal
          isOpen={viewModalOpen}
          onClose={closeViewModal}
          customer={selectedCustomer}
        />
      )}
    </div>
  );
};

interface ViewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
}

const ViewCustomerModal: React.FC<ViewCustomerModalProps> = ({
  isOpen,
  onClose,
  customer,
}) => {
  const badge = statusBadge(customer.banned);
  const fields: { label: string; value: string }[] = [
    { label: "Эл. почта", value: customer.email || "—" },
    { label: "Телефон", value: customer.phone || "—" },
    { label: "Город", value: customer.city || "—" },
    { label: "Адрес офиса", value: customer.officeAddress || "—" },
    { label: "Роль", value: formatRole(customer.role) },
    { label: "Браузер", value: formatBrowser(customer.lastBrowser) },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-5">
        <div className="mb-4 flex items-center gap-2 pr-10">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {getDisplayName(customer)}
          </h2>
          <Badge size="sm" variant="light" color={badge.color}>{badge.label}</Badge>
        </div>

        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.label}>
              <dt className="text-xs text-gray-500 dark:text-gray-400">{f.label}</dt>
              <dd className="text-sm text-gray-800 dark:text-white/90">{f.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 flex justify-end">
          <Button size="sm" variant="outline" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CustomersTable;
