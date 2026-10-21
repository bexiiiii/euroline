"use client";

import React, { useState, useEffect } from "react";
import StatCard, { StatGrid } from "../common/StatCard";
import { AlertIcon, EyeIcon, KeyIcon, ListIcon, RefreshIcon, ServerIcon, iconButtonClass, toolbarIconButtonClass } from "../analytics/StatIcons";
import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";
import { Modal } from "../ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import { eventLogApi, EventLog } from "@/lib/api/event-log";
import { logPageView } from "@/lib/eventLogger";
import ExportWithDateRange, { ExportDateRange } from "@/components/common/ExportWithDateRange";
import { exportAdminData } from "@/lib/api/importExport";
import { useToast } from "@/context/ToastContext";

const EVENT_LIMIT = 100;

const EventLogPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventLog | null>(null);
  const [filterType, setFilterType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalEvents, setTotalEvents] = useState(0);
  const { success: showSuccess, error: showError } = useToast();

  useEffect(() => {
    loadEventLogs();
    // Log page view
    logPageView('Журнал событий', '/event-log');
  }, []);

  const loadEventLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await eventLogApi.getEventLogs(0, EVENT_LIMIT, 'createdAt,desc');
      setEventLogs(data.content || []);
      setTotalEvents(data.totalElements ?? (data.content || []).length);
    } catch (e) {
      console.error("Не удалось загрузить журнал событий", e);
      setError("Не удалось загрузить журнал событий");
      setEventLogs([]);
      setTotalEvents(0);
    } finally {
      setLoading(false);
    }
  };

  const buildFileName = (base: string, from?: string, to?: string) => {
    const parts = [base];
    if (from) parts.push(from);
    if (to && to !== from) parts.push(to);
    return `${parts.join("-")}.csv`;
  };

  const handleExportEventLogs = async ({ from, to }: ExportDateRange) => {
    try {
      await exportAdminData({
        type: "event_logs",
        from: from || undefined,
        to: to || undefined,
        fileName: buildFileName("event-logs", from, to),
      });
      showSuccess("Экспорт сформирован");
    } catch (err) {
      console.error("Не удалось экспортировать журнал событий", err);
      showError("Не удалось выполнить экспорт");
    }
  };

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case "USER_LOGIN":
      case "USER_LOGOUT":
      case "USER_CREATED":
      case "USER_UPDATED":
      case "USER_DELETED":
        return <Badge variant="light" color="primary" size="sm">Пользователь</Badge>;
      case "SYSTEM_BACKUP":
      case "SYSTEM_RESTART":
        return <Badge variant="light" color="info" size="sm">Система</Badge>;
      case "ERROR_OCCURRED":
        return <Badge variant="light" color="error" size="sm">Ошибка</Badge>;
      case "SECURITY_EVENT":
        return <Badge variant="light" color="warning" size="sm">Безопасность</Badge>;
      case "ORDER_CREATED":
      case "ORDER_UPDATED":
      case "ORDER_CANCELLED":
        return <Badge variant="light" color="success" size="sm">Заказ</Badge>;
      case "PAYMENT_COMPLETED":
      case "PAYMENT_FAILED":
      case "REFUND_ISSUED":
        return <Badge variant="light" color="light" size="sm">Платеж</Badge>;
      case "PRODUCT_CREATED":
      case "PRODUCT_UPDATED":
      case "PRODUCT_DELETED":
        return <Badge variant="light" color="light" size="sm">Товар</Badge>;
      case "SETTINGS_UPDATED":
        return <Badge variant="light" color="info" size="sm">Настройки</Badge>;
      case "ADMIN_ACTION":
        return <Badge variant="light" color="primary" size="sm">Администратор</Badge>;
      default:
        return <Badge variant="light" color="light" size="sm">Прочее</Badge>;
    }
  };

  const getSuccessBadge = (success: boolean) => {
    return success 
      ? <Badge variant="light" color="success" size="sm">Успешно</Badge>
      : <Badge variant="light" color="error" size="sm">Ошибка</Badge>;
  };

  const openEventDetails = (event: EventLog) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const filteredEvents = eventLogs.filter(event => {
    if (filterType && event.eventType !== filterType) return false;
    if (searchTerm && !event.description.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !event.userName?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const eventTypeOptions = [
    { value: "", label: "Все типы" },
    { value: "USER_LOGIN", label: "Вход пользователя" },
    { value: "USER_LOGOUT", label: "Выход пользователя" },
    { value: "ERROR_OCCURRED", label: "Ошибки" },
    { value: "SECURITY_EVENT", label: "Безопасность" },
    { value: "ORDER_CREATED", label: "Заказы" },
    { value: "PAYMENT_COMPLETED", label: "Платежи" }
  ];

  const getEventStats = () => {
    const total = Math.max(totalEvents, eventLogs.length);
    const errors = eventLogs.filter(e => !e.success).length;
    const security = eventLogs.filter(e => e.eventType === "SECURITY_EVENT").length;
    const systemEvents = eventLogs.filter(e => e.eventType === "SYSTEM_BACKUP" || e.eventType === "SYSTEM_RESTART").length;
    return { total, errors, security, systemEvents };
  };

  const stats = getEventStats();

  const hasFilters = Boolean(searchTerm || filterType);

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">Загрузка...</div>
      ) : error ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-error-600 dark:text-error-400">Не удалось загрузить данные</p>
          <Button size="xs" variant="outline" className="mt-3" onClick={loadEventLogs}>
            Повторить
          </Button>
        </div>
      ) : (
        <>
          <StatGrid>
            <StatCard label="Всего событий" value={stats.total.toLocaleString("ru-RU")} icon={<ListIcon />} />
            <StatCard
              label="Ошибки"
              value={stats.errors}
              icon={<AlertIcon />}
              tone={stats.errors > 0 ? "error" : "default"}
            />
            <StatCard label="Безопасность" value={stats.security} icon={<KeyIcon />} />
            <StatCard label="Система" value={stats.systemEvents} icon={<ServerIcon />} />
          </StatGrid>

          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 p-4 dark:border-gray-800">
              <label htmlFor="event-log-search" className="sr-only">
                Поиск по описанию или пользователю
              </label>
              <div className="w-full sm:w-64">
                <Input
                  id="event-log-search"
                  type="text"
                  placeholder="Поиск"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10!"
                />
              </div>
              <label className="block w-full sm:w-48">
                <span className="sr-only">Тип события</span>
                <Select
                  options={eventTypeOptions}
                  value={filterType}
                  onChange={(value) => setFilterType(value)}
                  placeholder="Тип события"
                  className="h-10!"
                />
              </label>
              {hasFilters && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-10! py-0!"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterType("");
                  }}
                >
                  Сбросить
                </Button>
              )}
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadEventLogs}
                  className={toolbarIconButtonClass}
                  aria-label="Обновить"
                  title="Обновить"
                >
                  <RefreshIcon />
                </button>
                <ExportWithDateRange
                  triggerLabel="Экспорт"
                  size="sm"
                  variant="outline"
                  className="h-10! py-0!"
                  onConfirm={handleExportEventLogs}
                  title="Экспорт журнала событий"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table className="min-w-[820px]">
                <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                  <TableRow>
                    <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Время</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Тип</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Описание</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Пользователь</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Статус</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                      <span className="sr-only">Действия</span>
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredEvents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        {hasFilters ? "Ничего не найдено" : "Событий пока нет"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEvents.map((event) => (
                      <TableRow key={event.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                        <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap tabular-nums">
                          {formatDateTime(event.createdAt)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{getEventTypeBadge(event.eventType)}</TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          <div className="max-w-md line-clamp-2 text-gray-800 dark:text-white/90">
                            {event.description}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{event.userName || "Система"}</TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{getSuccessBadge(event.success)}</TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => openEventDetails(event)}
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

            {eventLogs.length > 0 && (
              <p className="border-t border-gray-100 px-4 py-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
                {totalEvents > eventLogs.length
                  ? `Последние ${eventLogs.length} из ${totalEvents}`
                  : `Всего ${eventLogs.length}`}
              </p>
            )}
          </div>

          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="lg">
            {selectedEvent && (
              <div className="space-y-4 p-5">
                <h3 className="pr-8 text-base font-semibold text-gray-800 dark:text-white/90">Событие</h3>

                <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400">Время</dt>
                    <dd className="tabular-nums text-gray-800 dark:text-white/90">{formatDateTime(selectedEvent.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400">Пользователь</dt>
                    <dd className="text-gray-800 dark:text-white/90">{selectedEvent.userName || "Система"}</dd>
                  </div>
                  <div>
                    <dt className="mb-1 text-xs text-gray-500 dark:text-gray-400">Тип</dt>
                    <dd>{getEventTypeBadge(selectedEvent.eventType)}</dd>
                  </div>
                  <div>
                    <dt className="mb-1 text-xs text-gray-500 dark:text-gray-400">Статус</dt>
                    <dd>{getSuccessBadge(selectedEvent.success)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400">IP-адрес</dt>
                    <dd className="text-gray-800 dark:text-white/90">{selectedEvent.ipAddress || "—"}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs text-gray-500 dark:text-gray-400">Браузер</dt>
                    <dd className="truncate text-gray-800 dark:text-white/90" title={selectedEvent.userAgent || undefined}>
                      {selectedEvent.userAgent || "—"}
                    </dd>
                  </div>
                </dl>

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Описание</p>
                  <p className="mt-0.5 text-sm text-gray-800 dark:text-white/90">{selectedEvent.description}</p>
                </div>

                {selectedEvent.details && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Детали</p>
                    <p className="mt-0.5 break-words text-sm text-gray-700 dark:text-gray-300">{selectedEvent.details}</p>
                  </div>
                )}

                {selectedEvent.errorMessage && (
                  <div className="rounded-lg bg-error-50 p-3 text-sm text-error-700 dark:bg-error-500/15 dark:text-error-400">
                    {selectedEvent.errorMessage}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button size="sm" variant="outline" onClick={() => setIsModalOpen(false)}>
                    Закрыть
                  </Button>
                </div>
              </div>
            )}
          </Modal>
        </>
      )}
    </div>
  );
};

export default EventLogPage;
