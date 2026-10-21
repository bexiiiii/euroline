"use client";

import React, { useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Select from "@/components/form/Select";
import Input from "@/components/form/input/InputField";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { notificationsApi, AdminNotificationHistoryItem, NotificationAudience } from "@/lib/api/notifications";
import { EyeIcon, iconButtonClass } from "@/components/analytics/StatIcons";
import { Modal } from "@/components/ui/modal";
import { API_URL } from "@/lib/api";
import Pagination from "@/components/ui/pagination/Pagination";

interface AdminNotificationHistoryTableProps {
  refreshKey: number;
  action?: React.ReactNode;
}

type AudienceFilterValue = NotificationAudience | "any";
type HighlightFilterValue = "any" | "important" | "normal";

const audienceFilterOptions = [
  { value: "any" as AudienceFilterValue, label: "Все аудитории" },
  { value: "ALL" as AudienceFilterValue, label: "Всем пользователям" },
  { value: "USERS" as AudienceFilterValue, label: "Только клиентам" },
  { value: "ADMINS" as AudienceFilterValue, label: "Только администраторам" },
];

const highlightFilterOptions = [
  { value: "any" as HighlightFilterValue, label: "Все" },
  { value: "important" as HighlightFilterValue, label: "Важные" },
  { value: "normal" as HighlightFilterValue, label: "Обычные" },
];

const audienceLabels: Record<string, string> = {
  ALL: "Всем пользователям",
  USERS: "Клиенты",
  ADMINS: "Администраторы",
};

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "—";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
};

const buildImageUrl = (url?: string | null): string | null => {
  if (!url) {
    return null;
  }
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  return `${API_URL}${url}`;
};

const AdminNotificationHistoryTable: React.FC<AdminNotificationHistoryTableProps> = ({ refreshKey, action }) => {
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [items, setItems] = useState<AdminNotificationHistoryItem[]>([]);
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilterValue>("any");
  const [highlightFilter, setHighlightFilter] = useState<HighlightFilterValue>("any");
  const [searchValue, setSearchValue] = useState("");
  const [selected, setSelected] = useState<AdminNotificationHistoryItem | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const data = await notificationsApi.getAdminNotificationHistory(page, pageSize);
        if (!cancelled) {
          setItems(data.content);
          setTotalItems(data.totalElements);
          setTotalPages(Math.max(data.totalPages, 1));
        }
      } catch (err) {
        console.error("Failed to load notifications history", err);
        if (!cancelled) {
          setLoadError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [page, pageSize, refreshKey, reloadKey]);

  useEffect(() => {
    setPage(0);
  }, [refreshKey]);

  useEffect(() => {
    setPage(0);
  }, [audienceFilter, highlightFilter, searchValue]);

  const filteredItems = useMemo(() => {
    const searchTerm = searchValue.trim().toLowerCase();
    return items.filter((item) => {
      if (audienceFilter !== "any") {
        const target = (item.target || "").toUpperCase();
        if (target !== audienceFilter) {
          return false;
        }
      }
      if (highlightFilter === "important" && !item.status) {
        return false;
      }
      if (highlightFilter === "normal" && item.status) {
        return false;
      }
      if (searchTerm) {
        const haystack = `${item.title ?? ""} ${item.message ?? ""}`.toLowerCase();
        if (!haystack.includes(searchTerm)) {
          return false;
        }
      }
      return true;
    });
  }, [items, audienceFilter, highlightFilter, searchValue]);

  const hasActiveFilters =
    audienceFilter !== "any" || highlightFilter !== "any" || searchValue.trim().length > 0;

  const effectiveTotalItems = hasActiveFilters ? filteredItems.length : totalItems;
  const effectiveTotalPages = hasActiveFilters ? 1 : totalPages;
  const currentPageForPagination = hasActiveFilters ? 1 : page + 1;
  const itemsPerPage = hasActiveFilters ? Math.max(filteredItems.length, 1) : pageSize;

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 p-4 dark:border-gray-800">
        <label htmlFor="notification-history-search" className="sr-only">
          Поиск по теме или тексту
        </label>
        <div className="w-full sm:w-64">
          <Input
            id="notification-history-search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Поиск"
            className="h-10!"
          />
        </div>
        <label className="block w-full sm:w-52">
          <span className="sr-only">Аудитория</span>
          <Select
            value={audienceFilter}
            onChange={(value) => setAudienceFilter(value as AudienceFilterValue)}
            options={audienceFilterOptions}
            placeholder="Аудитория"
            className="h-10!"
          />
        </label>
        <label className="block w-full sm:w-40">
          <span className="sr-only">Важность</span>
          <Select
            value={highlightFilter}
            onChange={(value) => setHighlightFilter(value as HighlightFilterValue)}
            options={highlightFilterOptions}
            placeholder="Важность"
            className="h-10!"
          />
        </label>
        {action && <div className="ml-auto">{action}</div>}
      </div>

      <div className="overflow-x-auto">
        <Table className="min-w-[860px]">
          <TableHeader className="border-b border-gray-100 dark:border-gray-800">
            <TableRow>
              <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Тема</TableCell>
              <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Текст</TableCell>
              <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Аудитория</TableCell>
              <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Получателей</TableCell>
              <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Отправлено</TableCell>
              <TableCell isHeader className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                <span className="sr-only">Действия</span>
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  Загрузка...
                </TableCell>
              </TableRow>
            ) : loadError ? (
              <TableRow>
                <TableCell colSpan={6} className="px-4 py-8 text-center text-sm">
                  <p className="text-error-600 dark:text-error-400">Не удалось загрузить данные</p>
                  <Button size="xs" variant="outline" className="mt-2" onClick={() => setReloadKey((k) => k + 1)}>
                    Повторить
                  </Button>
                </TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  {hasActiveFilters ? "Ничего не найдено" : "Уведомлений пока нет"}
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex max-w-xs items-center gap-2">
                      <span className="break-words font-medium text-gray-800 dark:text-white/90">{item.title}</span>
                      {item.status && (
                        <Badge variant="light" size="sm" color="warning">
                          Важное
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    <div className="max-w-sm line-clamp-2">{item.message}</div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {audienceLabels[(item.target || "ALL").toUpperCase()] ?? item.target ?? "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 tabular-nums">{item.recipientCount}</TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {formatDateTime(item.createdAt ?? null)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelected(item)}
                      className={iconButtonClass}
                      aria-label="Просмотр"
                      title="Просмотр"
                    >
                      <EyeIcon />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        currentPage={currentPageForPagination}
        totalPages={Math.max(effectiveTotalPages, 1)}
        onPageChange={(nextPage) => {
          if (hasActiveFilters) {
            return;
          }
          setPage(Math.max(nextPage - 1, 0));
        }}
        totalItems={effectiveTotalItems}
        itemsPerPage={itemsPerPage}
      />

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        className="max-w-2xl"
      >
        {selected && (
          <div className="space-y-4 p-5">
            <div className="space-y-2 pr-8">
              <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
                {selected.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="light" size="sm" color="light">
                  {audienceLabels[(selected.target || "ALL").toUpperCase()] ?? selected.target ?? "—"}
                </Badge>
                {selected.status && (
                  <Badge variant="light" size="sm" color="warning">
                    Важное
                  </Badge>
                )}
              </div>
            </div>
            <p className="whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
              {selected.message}
            </p>
            <dl className="grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">Отправлено</dt>
                <dd className="text-gray-800 dark:text-white/90">{formatDateTime(selected.createdAt ?? null)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">Отправил</dt>
                <dd className="text-gray-800 dark:text-white/90">{selected.senderName ?? selected.senderEmail ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">Получателей</dt>
                <dd className="tabular-nums text-gray-800 dark:text-white/90">{selected.recipientCount}</dd>
              </div>
            </dl>
            {selected.imageUrl ? (
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={buildImageUrl(selected.imageUrl) ?? undefined} alt="Изображение уведомления" className="max-h-64 w-full object-cover" />
              </div>
            ) : null}
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setSelected(null)}>
                Закрыть
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminNotificationHistoryTable;
