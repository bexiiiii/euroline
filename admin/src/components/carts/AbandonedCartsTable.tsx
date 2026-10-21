"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table/index";
import Badge from "../ui/badge/Badge";
import Pagination from "../ui/pagination/Pagination";
import { cartsApi, CustomerCart } from "@/lib/api/carts";
import { formatKzt, formatDateTime } from "@/lib/format";

interface AbandonedCartsTableProps {
  onViewCart?: (cartId: number) => void;
  onSendReminder?: (cartId: number) => void;
  onClearCart?: (cartId: number) => void;
  onConvertToOrder?: (cartId: number) => void;
  refreshTrigger?: number;
  /** Кнопки справа в строке фильтров */
  actions?: React.ReactNode;
}

const TH = "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400";
const TD = "px-4 py-3 text-sm text-gray-700 dark:text-gray-300";
const ICON_BTN =
  "inline-flex size-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-gray-200";
const ICON_BTN_DANGER =
  "inline-flex size-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-error-50 hover:text-error-600 dark:text-gray-400 dark:hover:bg-error-500/15 dark:hover:text-error-500";

const AbandonedCartsTable: React.FC<AbandonedCartsTableProps> = ({
  onViewCart,
  onSendReminder,
  onClearCart,
  onConvertToOrder,
  refreshTrigger = 0,
  actions,
}) => {
  const [carts, setCarts] = useState<CustomerCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'ABANDONED' | ''>('ABANDONED');

  const itemsPerPage = 10;

  useEffect(() => {
    loadCarts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, refreshTrigger]);

  const loadCarts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartsApi.getCarts(
        currentPage - 1,
        itemsPerPage,
        'lastUpdated,desc',
        statusFilter || undefined
      );

      setCarts(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (e) {
      console.error("Ошибка при загрузке корзин:", e);
      setError(e instanceof Error && e.message ? e.message : "Не удалось загрузить корзины");
      setCarts([]);
    } finally {
      setLoading(false);
    }
  };

  // Поиск работает по загруженной странице: API корзин не поддерживает поиск.
  const visibleCarts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return carts;
    return carts.filter((cart) =>
      [cart.customerName, cart.customerEmail]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [carts, searchTerm]);

  const getDaysSinceLastActivity = (lastUpdated: string): number => {
    const now = new Date();
    const updatedDate = new Date(lastUpdated);
    const diffTime = Math.abs(now.getTime() - updatedDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const inputClass =
    "h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

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
        <input
          type="search"
          aria-label="Поиск по клиенту"
          placeholder="Поиск по имени или эл. почте"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`${inputClass} w-full sm:w-72`}
        />
        <select
          aria-label="Статус корзины"
          value={statusFilter}
          onChange={(e) => {
            setCurrentPage(1);
            setStatusFilter(e.target.value as 'ACTIVE' | 'ABANDONED' | '');
          }}
          className={inputClass}
        >
          <option value="">Все корзины</option>
          <option value="ACTIVE">Активные</option>
          <option value="ABANDONED">Брошенные</option>
        </select>
        {actions && <div className="ml-auto">{actions}</div>}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[820px]">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                <TableRow>
                  <TableCell isHeader className={TH}>Клиент</TableCell>
                  <TableCell isHeader className={TH}>Товары</TableCell>
                  <TableCell isHeader className={TH}>Сумма</TableCell>
                  <TableCell isHeader className={TH}>Статус</TableCell>
                  <TableCell isHeader className={TH}>Активность</TableCell>
                  <TableCell isHeader className={`${TH} text-right`}>
                    <span className="sr-only">Действия</span>
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-4 py-10 text-center">
                      <div className="mx-auto size-6 animate-spin rounded-full border-2 border-gray-200 border-t-brand-500"></div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                      Не удалось загрузить данные.{" "}
                      <button
                        type="button"
                        onClick={() => loadCarts()}
                        className="font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
                      >
                        Повторить
                      </button>
                    </TableCell>
                  </TableRow>
                ) : visibleCarts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                      {carts.length === 0 ? "Корзин пока нет" : "Ничего не найдено"}
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleCarts.map((cart) => {
                    const days = getDaysSinceLastActivity(cart.lastUpdated);
                    return (
                      <TableRow key={cart.id}>
                        <TableCell className={TD}>
                          <span className="block font-medium text-gray-800 dark:text-white/90">
                            {cart.customerName}
                          </span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400">
                            {cart.customerEmail}
                          </span>
                        </TableCell>
                        <TableCell className={`${TD} tabular-nums`}>{cart.totalItems} шт.</TableCell>
                        <TableCell className={`${TD} whitespace-nowrap font-medium tabular-nums`}>
                          {formatKzt(cart.totalAmount)}
                        </TableCell>
                        <TableCell className={TD}>
                          <Badge size="sm" color={cart.isAbandoned ? "warning" : "success"} variant="light">
                            {cart.isAbandoned ? "Брошенная" : "Активная"}
                          </Badge>
                        </TableCell>
                        <TableCell className={TD}>
                          <span className="block whitespace-nowrap">{formatDateTime(cart.lastUpdated)}</span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400">
                            {days === 0 ? "сегодня" : `${days} дн. назад`}
                          </span>
                        </TableCell>
                        <TableCell className={TD}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => onViewCart?.(cart.id)}
                              className={ICON_BTN}
                              title="Просмотр"
                              aria-label={`Просмотр корзины ${cart.id}`}
                            >
                              <svg {...svgProps}>
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>
                            {cart.isAbandoned && (
                              <button
                                type="button"
                                onClick={() => onSendReminder?.(cart.id)}
                                className={ICON_BTN}
                                title="Отправить напоминание"
                                aria-label={`Отправить напоминание по корзине ${cart.id}`}
                              >
                                <svg {...svgProps}>
                                  <path d="M4 6h16v12H4zM4 7l8 6 8-6" />
                                </svg>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onConvertToOrder?.(cart.id)}
                              className={ICON_BTN}
                              title="Оформить заказ"
                              aria-label={`Оформить заказ из корзины ${cart.id}`}
                            >
                              <svg {...svgProps}>
                                <path d="M9 11l3 3 8-8M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2h9" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => onClearCart?.(cart.id)}
                              className={ICON_BTN_DANGER}
                              title="Очистить"
                              aria-label={`Очистить корзину ${cart.id}`}
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
    </div>
  );
};

export default AbandonedCartsTable;
