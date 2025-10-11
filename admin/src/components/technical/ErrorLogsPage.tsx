"use client";
import React, { useState, useEffect } from "react";
import ComponentCard from "../common/ComponentCard";
import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";
import { Modal } from "../ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Select from "../form/Select";
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
  const [activeTab, setActiveTab] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [filterLevel, setFilterLevel] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showResolved, setShowResolved] = useState(false);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch error logs from API
  useEffect(() => {
    const fetchErrorLogs = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/admin/error-logs`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch error logs');
        }
        
        const data = await response.json();
        setErrorLogs(data.content || data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Failed to fetch error logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchErrorLogs();
  }, []);

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
        return <Badge color="dark" size="sm">Критическая</Badge>;
      case "ERROR":
        return <Badge color="error" size="sm">Ошибка</Badge>;
      case "WARN":
        return <Badge color="warning" size="sm">Предупреждение</Badge>;
      case "INFO":
        return <Badge color="info" size="sm">Информация</Badge>;
      default:
        return <Badge color="light" size="sm">{level}</Badge>;
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "FATAL":
        return <div className="w-2 h-2 rounded-full bg-red-700 animate-pulse"></div>;
      case "ERROR":
        return <div className="w-2 h-2 rounded-full bg-red-500"></div>;
      case "WARN":
        return <div className="w-2 h-2 rounded-full bg-yellow-500"></div>;
      case "INFO":
        return <div className="w-2 h-2 rounded-full bg-blue-500"></div>;
      default:
        return <div className="w-2 h-2 rounded-full bg-gray-400"></div>;
    }
  };

  const openErrorDetails = (error: ErrorLog) => {
    setSelectedError(error);
    setIsModalOpen(true);
  };

  const markAsResolved = async (errorId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/error-logs/${errorId}/resolve`, {
        method: 'PUT',
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
    } catch (err) {
      console.error('Failed to resolve error:', err);
      alert('Не удалось пометить ошибку как решенную');
    }
  };

  const filteredErrors = errorLogs.filter(error => {
    if (activeTab !== "all" && error.level !== activeTab) return false;
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

  const getErrorStats = () => {
    const total = errorLogs.length;
    const critical = errorLogs.filter(e => e.level === "FATAL" && !e.resolved).length;
    const errors = errorLogs.filter(e => e.level === "ERROR" && !e.resolved).length;
    const warnings = errorLogs.filter(e => e.level === "WARN" && !e.resolved).length;
    const resolved = errorLogs.filter(e => e.resolved).length;
    
    return { total, critical, errors, warnings, resolved };
  };

  const stats = getErrorStats();

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            <p className="text-lg font-medium">Загрузка логов ошибок...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-red-500 dark:text-red-400">
            <p className="text-lg font-medium">Ошибка загрузки: {error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 text-sm underline hover:no-underline"
            >
              Обновить страницу
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Статистика */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Всего ошибок</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">записей в логе</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Критические</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-3xl font-bold text-red-700 dark:text-red-400">{stats.critical}</p>
                {stats.critical > 0 && (
                  <div className="ml-2 flex items-center">
                    <div className="w-2 h-2 rounded-full bg-red-700 animate-pulse"></div>
                  </div>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">требуют внимания</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Ошибки</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-3xl font-bold text-red-500 dark:text-red-400">{stats.errors}</p>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">активных ошибок</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Предупреждения</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-3xl font-bold text-yellow-500 dark:text-yellow-400">{stats.warnings}</p>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">предупреждений</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Решено</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-3xl font-bold text-green-500 dark:text-green-400">{stats.resolved}</p>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">ошибок исправлено</p>
            </div>
          </div>

          {/* Фильтры */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Поиск по сообщению или файлу</Label>
                <Input
                  type="text"
                  placeholder="Введите текст для поиска..."
                  defaultValue={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Label>Уровень ошибки</Label>
                <Select
                  options={levelOptions}
                  onChange={(value) => setFilterLevel(value)}
                  placeholder="Выберите уровень"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showResolved}
                    onChange={(e) => setShowResolved(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Показать решенные
                  </span>
                </label>
              </div>
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("");
                    setFilterLevel("");
                    setShowResolved(false);
                  }}
                  className="w-full"
                >
                  Сбросить фильтры
                </Button>
              </div>
            </div>
          </div>

          {/* Основной контент */}
          <ComponentCard
            title="Логи ошибок системы"
            description="Мониторинг и анализ ошибок приложения"
            action={
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">Очистить старые логи</Button>
                <Button size="sm" variant="outline">Экспорт логов</Button>
                <Button size="sm">Настройки логирования</Button>
              </div>
            }
          >
            {/* Табы */}
            <div className="border-b border-gray-200 dark:border-gray-700 -mx-6 px-6">
              <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "all"
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  Все ошибки
                </button>
                <button
                  onClick={() => setActiveTab("FATAL")}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "FATAL"
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  Критические
                </button>
                <button
                  onClick={() => setActiveTab("ERROR")}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "ERROR"
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  Ошибки
                </button>
                <button
                  onClick={() => setActiveTab("WARN")}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "WARN"
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  Предупреждения
                </button>
              </nav>
            </div>

            {/* Таблица ошибок */}
            <div className="mt-6">
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className="max-w-full overflow-x-auto">
                  <div className="min-w-[1400px]">
                    <Table>
                      <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                        <TableRow>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Время</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Уровень</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Сообщение</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Логгер</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Класс</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Метод</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Статус</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Действия</TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                        {filteredErrors.map((error) => (
                          <TableRow key={error.id} className={error.resolved ? "opacity-60" : ""}>
                            <TableCell className="px-5 py-4 sm:px-6 text-start">
                              <div className="text-gray-700 text-theme-sm dark:text-gray-300 font-mono">
                                {formatDateTime(error.timestamp)}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-start text-theme-sm">
                              <div className="flex items-center space-x-2">
                                {getLevelIcon(error.level)}
                                {getLevelBadge(error.level)}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-start text-theme-sm">
                              <div className="max-w-md">
                                <div className="font-medium text-gray-800 dark:text-white/90 line-clamp-2">
                                  {error.message}
                                </div>
                                {error.exception && (
                                  <div className="text-gray-500 text-theme-xs dark:text-gray-400 mt-1">
                                    {error.exception}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-start text-theme-sm">
                              <div className="font-mono text-gray-700 dark:text-gray-300">
                                <div className="truncate max-w-xs">{error.logger}</div>
                                {error.threadName && (
                                  <div className="text-gray-500 text-theme-xs dark:text-gray-400">
                                    Thread: {error.threadName}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-start text-theme-sm">
                              <div className="font-mono text-gray-700 dark:text-gray-300">
                                {error.className && (
                                  <div className="truncate max-w-xs">{error.className}</div>
                                )}
                                {error.fileName && (
                                  <div className="text-gray-500 text-theme-xs dark:text-gray-400">
                                    {error.fileName}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-start text-theme-sm">
                              <div className="font-mono text-gray-700 dark:text-gray-300">
                                {error.methodName && (
                                  <div className="truncate max-w-xs">{error.methodName}</div>
                                )}
                                {error.lineNumber && (
                                  <div className="text-gray-500 text-theme-xs dark:text-gray-400">
                                    Строка {error.lineNumber}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-start text-theme-sm">
                              {error.resolved ? (
                                <Badge color="success" size="sm">Решено</Badge>
                              ) : (
                                <Badge color="error" size="sm">Активна</Badge>
                              )}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-start">
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openErrorDetails(error)}
                                >
                                  Подробнее
                                </Button>
                                {!error.resolved && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => markAsResolved(error.id)}
                                  >
                                    Решено
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              {filteredErrors.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-500 dark:text-gray-400">
                    <p className="text-lg font-medium">Ошибки не найдены</p>
                    <p className="text-sm mt-1">Попробуйте изменить фильтры поиска</p>
                  </div>
                </div>
              )}
            </div>
          </ComponentCard>

          {/* Модальное окно с подробностями ошибки */}
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="xl">
            {selectedError && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                  Подробности ошибки
                </h3>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Время возникновения</Label>
                      <div className="font-mono text-sm text-gray-700 dark:text-gray-300">
                        {formatDateTime(selectedError.timestamp)}
                      </div>
                    </div>
                    <div>
                      <Label>Уровень</Label>
                      <div>{getLevelBadge(selectedError.level)}</div>
                    </div>
                    <div>
                      <Label>Метод</Label>
                      <div className="font-mono text-sm text-gray-700 dark:text-gray-300">
                        {selectedError.methodName || 'Не указан'}
                      </div>
                    </div>
                    <div>
                      <Label>Поток</Label>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {selectedError.threadName || 'Не указан'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Сообщение об ошибке</Label>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-800 dark:text-red-300">
                      {selectedError.message}
                    </div>
                  </div>

                  <div>
                    <Label>Логгер</Label>
                    <div className="font-mono text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded p-2">
                      {selectedError.logger}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Класс</Label>
                      <div className="font-mono text-sm text-gray-700 dark:text-gray-300">
                        {selectedError.className || 'Не указан'}
                      </div>
                    </div>
                    <div>
                      <Label>Файл и строка</Label>
                      <div className="font-mono text-sm text-gray-700 dark:text-gray-300">
                        {selectedError.fileName && selectedError.lineNumber 
                          ? `${selectedError.fileName}:${selectedError.lineNumber}`
                          : 'Не указано'
                        }
                      </div>
                    </div>
                  </div>

                  {selectedError.stackTrace && (
                    <div>
                      <Label>Stack Trace</Label>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                        {selectedError.stackTrace}
                      </div>
                    </div>
                  )}

                  {selectedError.exception && (
                    <div>
                      <Label>Исключение</Label>
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-800 dark:text-red-300 font-mono">
                        {selectedError.exception}
                      </div>
                    </div>
                  )}

                  {selectedError.resolved && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="text-green-800 dark:text-green-300">
                        <div className="font-medium">Ошибка решена</div>
                        <div className="text-sm mt-1">
                          Решена {formatDateTime(selectedError.resolvedAt!)} пользователем {selectedError.resolvedBy}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-6 space-x-3">
                  {!selectedError.resolved && (
                    <Button onClick={() => markAsResolved(selectedError.id)}>
                      Пометить как решено
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>
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

export default ErrorLogsPage;
