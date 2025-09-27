"use client";
import React, { useState } from "react";
import ComponentCard from "../common/ComponentCard";
import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";
import { Modal } from "../ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Select from "../form/Select";

interface ErrorLog {
  id: number;
  timestamp: string;
  level: "error" | "warning" | "critical" | "info";
  message: string;
  file: string;
  line: number;
  method: string;
  url: string;
  userId?: number;
  userAgent: string;
  ipAddress: string;
  stackTrace: string;
  context: Record<string, any>;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  count: number;
  firstOccurred: string;
  lastOccurred: string;
}

const ErrorLogsPage = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [filterLevel, setFilterLevel] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showResolved, setShowResolved] = useState(false);

  const [errorLogs] = useState<ErrorLog[]>([
    {
      id: 1,
      timestamp: "2024-12-15T14:30:15Z",
      level: "critical",
      message: "Database connection timeout",
      file: "/app/database/Connection.php",
      line: 142,
      method: "GET",
      url: "/api/products",
      userId: 123,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      ipAddress: "192.168.1.100",
      stackTrace: `PDOException: SQLSTATE[HY000] [2002] Connection timed out
at /app/database/Connection.php:142
at Database\\Connection->connect()
at ProductController->index()
at Illuminate\\Routing\\Controller->callAction()`,
      context: {
        request_id: "req_123456",
        user_id: 123,
        query_time: 30.5,
        memory_usage: "45.2MB"
      },
      resolved: false,
      count: 15,
      firstOccurred: "2024-12-15T14:00:00Z",
      lastOccurred: "2024-12-15T14:30:15Z"
    },
    {
      id: 2,
      timestamp: "2024-12-15T14:25:32Z",
      level: "error",
      message: "Undefined variable: product",
      file: "/app/Controllers/ProductController.php",
      line: 89,
      method: "POST",
      url: "/admin/products/update",
      userId: 1,
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      ipAddress: "10.0.0.5",
      stackTrace: `ErrorException: Undefined variable: product
at /app/Controllers/ProductController.php:89
at ProductController->update()
at Illuminate\\Routing\\Controller->callAction()`,
      context: {
        request_id: "req_123457",
        user_id: 1,
        form_data: { name: "Test Product", price: 1000 }
      },
      resolved: true,
      resolvedAt: "2024-12-15T14:40:00Z",
      resolvedBy: "developer@autoparts.ru",
      count: 3,
      firstOccurred: "2024-12-15T14:20:00Z",
      lastOccurred: "2024-12-15T14:25:32Z"
    },
    {
      id: 3,
      timestamp: "2024-12-15T14:20:45Z",
      level: "warning",
      message: "Deprecated function usage: mysql_connect()",
      file: "/app/Legacy/Database.php",
      line: 25,
      method: "GET",
      url: "/legacy/reports",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      ipAddress: "172.16.0.10",
      stackTrace: `Deprecated: Function mysql_connect() is deprecated
at /app/Legacy/Database.php:25
at LegacyDatabase->connect()
at ReportController->legacy()`,
      context: {
        request_id: "req_123458",
        legacy_system: true
      },
      resolved: false,
      count: 8,
      firstOccurred: "2024-12-14T10:00:00Z",
      lastOccurred: "2024-12-15T14:20:45Z"
    },
    {
      id: 4,
      timestamp: "2024-12-15T14:15:12Z",
      level: "error",
      message: "Payment gateway API error",
      file: "/app/Services/PaymentService.php",
      line: 156,
      method: "POST",
      url: "/api/payments/process",
      userId: 456,
      userAgent: "AutoPartsApp/1.2.3",
      ipAddress: "203.45.67.89",
      stackTrace: `GuzzleHttp\\Exception\\ClientException: 400 Bad Request
at /app/Services/PaymentService.php:156
at PaymentService->processPayment()
at OrderController->pay()`,
      context: {
        request_id: "req_123459",
        payment_gateway: "sberbank",
        amount: 15000,
        order_id: "ORD-2024-001234"
      },
      resolved: false,
      count: 2,
      firstOccurred: "2024-12-15T14:10:00Z",
      lastOccurred: "2024-12-15T14:15:12Z"
    },
    {
      id: 5,
      timestamp: "2024-12-15T14:10:08Z",
      level: "info",
      message: "Large query execution time",
      file: "/app/Models/Product.php",
      line: 234,
      method: "GET",
      url: "/admin/products/export",
      userId: 1,
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      ipAddress: "10.0.0.5",
      stackTrace: "Query took 5.2 seconds to execute",
      context: {
        request_id: "req_123460",
        query_time: 5.2,
        query: "SELECT * FROM products LEFT JOIN categories...",
        affected_rows: 25000
      },
      resolved: false,
      count: 1,
      firstOccurred: "2024-12-15T14:10:08Z",
      lastOccurred: "2024-12-15T14:10:08Z"
    }
  ]);

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
      case "critical":
        return <Badge color="dark" size="sm">Критическая</Badge>;
      case "error":
        return <Badge color="error" size="sm">Ошибка</Badge>;
      case "warning":
        return <Badge color="warning" size="sm">Предупреждение</Badge>;
      case "info":
        return <Badge color="info" size="sm">Информация</Badge>;
      default:
        return <Badge color="light" size="sm">{level}</Badge>;
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "critical":
        return <div className="w-2 h-2 rounded-full bg-red-700 animate-pulse"></div>;
      case "error":
        return <div className="w-2 h-2 rounded-full bg-red-500"></div>;
      case "warning":
        return <div className="w-2 h-2 rounded-full bg-yellow-500"></div>;
      case "info":
        return <div className="w-2 h-2 rounded-full bg-blue-500"></div>;
      default:
        return <div className="w-2 h-2 rounded-full bg-gray-400"></div>;
    }
  };

  const openErrorDetails = (error: ErrorLog) => {
    setSelectedError(error);
    setIsModalOpen(true);
  };

  const markAsResolved = (errorId: number) => {
    // Здесь будет логика пометки ошибки как решенной
    console.log("Marking error as resolved:", errorId);
  };

  const filteredErrors = errorLogs.filter(error => {
    if (activeTab !== "all" && error.level !== activeTab) return false;
    if (filterLevel && error.level !== filterLevel) return false;
    if (!showResolved && error.resolved) return false;
    if (searchTerm && 
        !error.message.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !error.file.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const levelOptions = [
    { value: "", label: "Все уровни" },
    { value: "critical", label: "Критические" },
    { value: "error", label: "Ошибки" },
    { value: "warning", label: "Предупреждения" },
    { value: "info", label: "Информационные" }
  ];

  const getErrorStats = () => {
    const total = errorLogs.length;
    const critical = errorLogs.filter(e => e.level === "critical" && !e.resolved).length;
    const errors = errorLogs.filter(e => e.level === "error" && !e.resolved).length;
    const warnings = errorLogs.filter(e => e.level === "warning" && !e.resolved).length;
    const resolved = errorLogs.filter(e => e.resolved).length;
    
    return { total, critical, errors, warnings, resolved };
  };

  const stats = getErrorStats();

  return (
    <div className="space-y-6">
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
              onClick={() => setActiveTab("critical")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "critical"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Критические
            </button>
            <button
              onClick={() => setActiveTab("error")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "error"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Ошибки
            </button>
            <button
              onClick={() => setActiveTab("warning")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "warning"
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
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Файл</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">URL</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Количество</TableCell>
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
                            <div className="font-medium text-gray-800 dark:text-white/90 truncate">
                              {error.message}
                            </div>
                            <div className="text-gray-500 text-theme-xs dark:text-gray-400">
                              IP: {error.ipAddress}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start text-theme-sm">
                          <div className="font-mono text-gray-700 dark:text-gray-300">
                            <div className="truncate max-w-xs">{error.file}</div>
                            <div className="text-gray-500 text-theme-xs dark:text-gray-400">
                              Строка {error.line}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start text-theme-sm">
                          <div className="flex items-center space-x-1">
                            <Badge color={error.method === "GET" ? "success" : error.method === "POST" ? "primary" : "warning"} size="sm">
                              {error.method}
                            </Badge>
                            <div className="font-mono text-gray-600 dark:text-gray-400 text-xs truncate max-w-xs">
                              {error.url}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start text-theme-sm">
                          <div className="text-center">
                            <div className="font-bold text-red-600 dark:text-red-400">
                              {error.count}
                            </div>
                            <div className="text-gray-500 text-theme-xs dark:text-gray-400">
                              {error.count > 1 ? "раз" : "раз"}
                            </div>
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
                  <Label>HTTP метод</Label>
                  <div>
                    <Badge color={selectedError.method === "GET" ? "success" : selectedError.method === "POST" ? "primary" : "warning"} size="sm">
                      {selectedError.method}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Количество повторений</Label>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {selectedError.count} раз
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
                <Label>URL запроса</Label>
                <div className="font-mono text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded p-2">
                  {selectedError.url}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Файл</Label>
                  <div className="font-mono text-sm text-gray-700 dark:text-gray-300">
                    {selectedError.file}:{selectedError.line}
                  </div>
                </div>
                <div>
                  <Label>IP адрес</Label>
                  <div className="font-mono text-sm text-gray-700 dark:text-gray-300">
                    {selectedError.ipAddress}
                  </div>
                </div>
              </div>

              <div>
                <Label>Stack Trace</Label>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {selectedError.stackTrace}
                </div>
              </div>

              <div>
                <Label>Контекст</Label>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300 font-mono">
                  <pre>{JSON.stringify(selectedError.context, null, 2)}</pre>
                </div>
              </div>

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
    </div>
  );
};

export default ErrorLogsPage;
