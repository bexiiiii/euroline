"use client";
import React, { useState, useEffect, useCallback } from "react";
import StatCard, { StatGrid } from "../common/StatCard";
import Checkbox from "../form/input/Checkbox";
import {
  AlertIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  RefreshIcon,
  iconButtonClass,
  toolbarIconButtonClass,
} from "../analytics/StatIcons";
import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";
import { Modal } from "../ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import ExportWithDateRange, { ExportDateRange } from "@/components/common/ExportWithDateRange";
import { downloadCsv } from "@/lib/utils/export";
import { useToast } from "@/context/ToastContext";
import { API_URL } from "@/lib/api";

interface ErrorLog {
  id: number;
  timestamp: string;
  level: "ERROR" | "WARN" | "FATAL" | "INFO";
  logger: string;
  message: string;
  exception?: string;
  stackTrace?: string;
  threadName?: string;
  className?: string;
  methodName?: string;
  lineNumber?: number;
  fileName?: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

const ErrorLogsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [filterLevel, setFilterLevel] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showResolved, setShowResolved] = useState(false);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { success: showSuccess, error: showError } = useToast();

  // Fetch error logs from API
  const fetchErrorLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/api/admin/error-logs`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setErrorLogs(data.content || data);
    } catch (err) {
      setError('Не удалось загрузить логи ошибок');
      console.error('Failed to fetch error logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchErrorLogs();
  }, [fetchErrorLogs]);

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

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "FATAL":
        return <Badge variant="light" color="dark" size="sm">Критическая</Badge>;
      case "ERROR":
        return <Badge variant="light" color="error" size="sm">Ошибка</Badge>;
      case "WARN":
        return <Badge variant="light" color="warning" size="sm">Предупреждение</Badge>;
      case "INFO":
        return <Badge variant="light" color="info" size="sm">Информация</Badge>;
      default:
        return <Badge variant="light" color="light" size="sm">Прочее</Badge>;
    }
  };

  const openErrorDetails = (error: ErrorLog) => {
    setSelectedError(error);
    setIsModalOpen(true);
  };

  const markAsResolved = async (errorId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/error-logs/${errorId}?resolved=true`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to resolve error');
      }
      
      // Update the error in the state
      setErrorLogs(prevLogs => 
        prevLogs.map(log => 
          log.id === errorId 
            ? { ...log, resolved: true, resolvedAt: new Date().toISOString() }
            : log
        )
      );
      
      // Close modal if the resolved error is currently selected
      if (selectedError?.id === errorId) {
        setIsModalOpen(false);
      }
      showSuccess('Отмечено как решённое');
    } catch (err) {
      console.error('Failed to resolve error:', err);
      showError('Не удалось обновить статус');
    }
  };

  const filteredErrors = errorLogs.filter(error => {
    if (filterLevel && error.level !== filterLevel) return false;
    if (!showResolved && error.resolved) return false;
    if (searchTerm && 
        !error.message.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !error.logger.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !(error.className && error.className.toLowerCase().includes(searchTerm.toLowerCase()))) return false;
    return true;
  });

  const levelOptions = [
    { value: "", label: "Все уровни" },
    { value: "FATAL", label: "Критические" },
    { value: "ERROR", label: "Ошибки" },
    { value: "WARN", label: "Предупреждения" },
    { value: "INFO", label: "Информационные" }
  ];

  const handleExportLogs = async ({ from, to }: ExportDateRange) => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    const filtered = errorLogs.filter((log) => {
      const logDate = new Date(log.timestamp);
      return logDate >= fromDate && logDate <= toDate;
    });

    if (filtered.length === 0) {
      showError("За период записей нет");
      return;
    }

    const header = ["ID", "Время", "Уровень", "Сообщение", "Логгер", "Класс", "Метод", "Решена"];
    const rows = filtered.map((log) => [
      log.id,
      formatDateTime(log.timestamp),
      log.level,
      log.message,
      log.logger,
      log.className ?? "",
      log.methodName ?? "",
      log.resolved ? "Да" : "Нет",
    ]);

    downloadCsv(`error-logs-${from}-${to}`, [header, ...rows]);
    showSuccess(`Экспортировано ${rows.length} записей`);
  };

  const getErrorStats = () => {
    const total = errorLogs.length;
    const critical = errorLogs.filter(e => e.level === "FATAL" && !e.resolved).length;
    const errors = errorLogs.filter(e => e.level === "ERROR" && !e.resolved).length;
    const warnings = errorLogs.filter(e => e.level === "WARN" && !e.resolved).length;
    const resolved = errorLogs.filter(e => e.resolved).length;
    
    return { total, critical, errors, warnings, resolved };
  };

  const stats = getErrorStats();

  const hasFilters = Boolean(searchTerm || filterLevel || showResolved);

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">Загрузка...</div>
      ) : error ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-error-600 dark:text-error-400">Не удалось загрузить данные</p>
          <Button size="xs" variant="outline" className="mt-3" onClick={fetchErrorLogs}>
            Повторить
          </Button>
        </div>
      ) : (
        <>
          <StatGrid>
            <StatCard
              label="Критические"
              value={stats.critical}
              icon={<AlertIcon />}
              tone={stats.critical > 0 ? "error" : "default"}
            />
            <StatCard
              label="Ошибки"
              value={stats.errors}
              icon={<AlertIcon />}
              tone={stats.errors > 0 ? "error" : "default"}
            />
            <StatCard
              label="Предупреждения"
              value={stats.warnings}
              icon={<ClockIcon />}
              tone={stats.warnings > 0 ? "warning" : "default"}
            />
            <StatCard label="Решено" value={stats.resolved} icon={<CheckCircleIcon />} hint={`из ${stats.total}`} />
          </StatGrid>

          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 p-4 dark:border-gray-800">
              <label htmlFor="error-log-search" className="sr-only">
                Поиск по сообщению
              </label>
              <div className="w-full sm:w-64">
                <Input
                  id="error-log-search"
                  type="text"
                  placeholder="Поиск"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10!"
                />
              </div>
              <label className="block w-full sm:w-48">
                <span className="sr-only">Уровень</span>
                <Select
                  options={levelOptions}
                  value={filterLevel}
                  onChange={(value) => setFilterLevel(value)}
                  placeholder="Уровень"
                  className="h-10!"
                />
              </label>
              <Checkbox label="Решённые" checked={showResolved} onChange={setShowResolved} />
              {hasFilters && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-10! py-0!"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterLevel("");
                    setShowResolved(false);
                  }}
                >
                  Сбросить
                </Button>
              )}
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchErrorLogs}
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
                  onConfirm={handleExportLogs}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table className="min-w-[760px]">
                <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                  <TableRow>
                    <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Время</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Уровень</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Сообщение</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Статус</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                      <span className="sr-only">Действия</span>
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredErrors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        {hasFilters ? "Ничего не найдено" : "Ошибок нет"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredErrors.map((error) => (
                      <TableRow
                        key={error.id}
                        className={`hover:bg-gray-50 dark:hover:bg-white/[0.02] ${error.resolved ? "opacity-60" : ""}`}
                      >
                        <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap tabular-nums">
                          {formatDateTime(error.timestamp)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{getLevelBadge(error.level)}</TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          <div className="max-w-lg line-clamp-2 text-gray-800 dark:text-white/90">{error.message}</div>
                          {error.className && (
                            <div className="max-w-lg truncate text-xs text-gray-500 dark:text-gray-400">{error.className}</div>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {error.resolved ? (
                            <Badge variant="light" color="success" size="sm">Решено</Badge>
                          ) : (
                            <Badge variant="light" color="error" size="sm">Активна</Badge>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openErrorDetails(error)}
                              className={iconButtonClass}
                              aria-label="Просмотр"
                              title="Просмотр"
                            >
                              <EyeIcon />
                            </button>
                            {!error.resolved && (
                              <button
                                type="button"
                                onClick={() => markAsResolved(error.id)}
                                className={iconButtonClass}
                                aria-label="Отметить решённой"
                                title="Отметить решённой"
                              >
                                <CheckCircleIcon />
                              </button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="xl">
            {selectedError && (
              <div className="space-y-4 p-5">
                <div className="flex flex-wrap items-center gap-2 pr-8">
                  <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">Ошибка</h3>
                  {getLevelBadge(selectedError.level)}
                  {selectedError.resolved && (
                    <Badge variant="light" color="success" size="sm">Решено</Badge>
                  )}
                </div>

                <p className="text-sm text-gray-800 dark:text-white/90">{selectedError.message}</p>

                <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400">Время</dt>
                    <dd className="tabular-nums text-gray-800 dark:text-white/90">{formatDateTime(selectedError.timestamp)}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs text-gray-500 dark:text-gray-400">Источник</dt>
                    <dd className="truncate font-mono text-xs text-gray-700 dark:text-gray-300" title={selectedError.logger}>
                      {selectedError.fileName && selectedError.lineNumber
                        ? `${selectedError.fileName}:${selectedError.lineNumber}`
                        : selectedError.className || selectedError.logger}
                    </dd>
                  </div>
                  {selectedError.resolved && (
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-gray-500 dark:text-gray-400">Решена</dt>
                      <dd className="text-gray-800 dark:text-white/90">
                        {selectedError.resolvedAt ? formatDateTime(selectedError.resolvedAt) : "—"}
                        {selectedError.resolvedBy ? `, ${selectedError.resolvedBy}` : ""}
                      </dd>
                    </div>
                  )}
                </dl>

                {(selectedError.exception || selectedError.stackTrace) && (
                  <div>
                    <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">Подробности</p>
                    <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-3 font-mono text-xs text-gray-700 dark:bg-white/[0.03] dark:text-gray-300">
                      {[selectedError.exception, selectedError.stackTrace].filter(Boolean).join("\n\n")}
                    </pre>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => setIsModalOpen(false)}>
                    Закрыть
                  </Button>
                  {!selectedError.resolved && (
                    <Button size="sm" onClick={() => markAsResolved(selectedError.id)}>
                      Отметить решённой
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Modal>
        </>
      )}
    </div>
  );
};

export default ErrorLogsPage;
