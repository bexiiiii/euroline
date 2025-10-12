"use client";

import React, { useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Select from "@/components/form/Select";
import Input from "@/components/form/input/InputField";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { notificationsApi, AdminNotificationHistoryItem, NotificationAudience } from "@/lib/api/notifications";
import { useToast } from "@/context/ToastContext";
import { Modal } from "@/components/ui/modal";
import { API_URL } from "@/lib/api";

interface AdminNotificationHistoryTableProps {
  refreshKey: number;
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

const AdminNotificationHistoryTable: React.FC<AdminNotificationHistoryTableProps> = ({ refreshKey }) => {
  const { error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AdminNotificationHistoryItem[]>([]);
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilterValue>("any");
  const [highlightFilter, setHighlightFilter] = useState<HighlightFilterValue>("any");
  const [searchValue, setSearchValue] = useState("");
  const [selected, setSelected] = useState<AdminNotificationHistoryItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await notificationsApi.getAdminNotificationHistory();
        if (!cancelled) {
          setItems(data);
        }
      } catch (err) {
        console.error("Failed to load notifications history", err);
        if (!cancelled) {
          showError("Не удалось загрузить историю уведомлений");
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
  }, [refreshKey, showError]);

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

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-5 dark:border-gray-800 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">История уведомлений</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Просматривайте отправленные рассылки и отслеживайте получателей.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Поиск по теме или тексту"
            className="w-full sm:w-64"
          />
          <Select
            value={audienceFilter}
            onChange={(value) => setAudienceFilter(value as AudienceFilterValue)}
            options={audienceFilterOptions}
          />
          <Select
            value={highlightFilter}
            onChange={(value) => setHighlightFilter(value as HighlightFilterValue)}
            options={highlightFilterOptions}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table className="min-w-[960px]">
          <TableHeader className="border-gray-100 dark:border-gray-800 border-b bg-gray-50/40 dark:bg-white/[0.02]">
            <TableRow>
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Тема
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Текст
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Аудитория
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Важность
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Получателей
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Отправил
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Отправлено
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Действия
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="px-6 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  Загрузка истории...
                </TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="px-6 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  За выбранный период уведомлений не найдено
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50/60 dark:hover:bg-white/[0.04]">
                  <TableCell className="px-6 py-4 align-top">
                    <div className="max-w-xs break-words text-sm font-semibold text-gray-900 dark:text-white">
                      {item.title}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 align-top">
                    <div className="max-w-md text-sm text-gray-600 line-clamp-2 dark:text-gray-300">
                      {item.message}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 align-top">
                    <Badge variant="light" color="info">
                      {audienceLabels[(item.target || "ALL").toUpperCase()] ?? item.target ?? "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 align-top">
                    <Badge color={item.status ? "warning" : "light"}>
                      {item.status ? "Важное" : "Обычное"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 align-top text-sm text-gray-600 dark:text-gray-300">
                    {item.recipientCount}
                  </TableCell>
                  <TableCell className="px-6 py-4 align-top text-sm text-gray-600 dark:text-gray-300">
                    {item.senderName ?? item.senderEmail ?? "—"}
                  </TableCell>
                  <TableCell className="px-6 py-4 align-top text-sm text-gray-600 dark:text-gray-300">
                    {formatDateTime(item.createdAt ?? null)}
                  </TableCell>
                  <TableCell className="px-6 py-4 align-top text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="xs" variant="outline" onClick={() => setSelected(item)}>
                        Подробнее
                      </Button>
                      {item.imageUrl ? (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            const resolvedUrl = buildImageUrl(item.imageUrl);
                            if (resolvedUrl) {
                              window.open(resolvedUrl, "_blank", "noopener");
                            }
                          }}
                        >
                          Изображение
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        className="max-w-2xl"
      >
        {selected && (
          <div className="space-y-5 p-6 sm:p-7">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {selected.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="light" color="info">
                  {audienceLabels[(selected.target || "ALL").toUpperCase()] ?? selected.target ?? "—"}
                </Badge>
                <Badge color={selected.status ? "warning" : "light"}>
                  {selected.status ? "Важное" : "Обычное"}
                </Badge>
                <Badge variant="light">
                  Получателей: {selected.recipientCount}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Текст уведомления</h4>
              <p className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-300">
                {selected.message}
              </p>
            </div>
            <div className="grid gap-3 text-sm text-gray-600 dark:text-gray-300 sm:grid-cols-2">
              <div>
                <span className="text-xs uppercase text-gray-400 dark:text-gray-500">Отправлено</span>
                <p className="font-medium text-gray-800 dark:text-gray-200">
                  {formatDateTime(selected.createdAt ?? null)}
                </p>
              </div>
              <div>
                <span className="text-xs uppercase text-gray-400 dark:text-gray-500">Отправил</span>
                <p className="font-medium text-gray-800 dark:text-gray-200">
                  {selected.senderName ?? selected.senderEmail ?? "—"}
                </p>
              </div>
            </div>
            {selected.imageUrl ? (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Прикрепленное изображение</h4>
                <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={buildImageUrl(selected.imageUrl) ?? undefined} alt="Превью" className="h-64 w-full object-cover" />
                </div>
              </div>
            ) : null}
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setSelected(null)}>
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
