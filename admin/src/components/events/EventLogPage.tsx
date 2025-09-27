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

interface EventLog {
  id: number;
  timestamp: string;
  eventType: "user_action" | "system" | "error" | "security" | "order" | "payment";
  severity: "low" | "medium" | "high" | "critical";
  source: string;
  user?: string;
  userId?: number;
  description: string;
  details: string;
  ipAddress: string;
  userAgent?: string;
  affected_entity?: string;
  entity_id?: number;
}

const EventLogPage = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventLog | null>(null);
  const [filterType, setFilterType] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Данные журнала событий
  const eventLogs: EventLog[] = [
    {
      id: 1,
      timestamp: "2024-12-15T14:30:15Z",
      eventType: "user_action",
      severity: "low",
      source: "Web Interface",
      user: "admin@autoparts.ru",
      userId: 1,
      description: "Администратор просмотрел список пользователей",
      details: "Страница: /admin/users, Количество записей: 50",
      ipAddress: "192.168.1.10",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      affected_entity: "users",
      entity_id: undefined
    },
    {
      id: 2,
      timestamp: "2024-12-15T14:25:32Z",
      eventType: "security",
      severity: "medium",
      source: "Authentication System",
      user: "manager@autoparts.ru",
      userId: 5,
      description: "Неудачная попытка входа в систему",
      details: "Неверный пароль для пользователя manager@autoparts.ru",
      ipAddress: "203.45.67.89",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      affected_entity: "authentication",
      entity_id: 5
    },
    {
      id: 3,
      timestamp: "2024-12-15T14:20:45Z",
      eventType: "order",
      severity: "low",
      source: "Order Management",
      user: "client@example.com",
      userId: 123,
      description: "Создан новый заказ",
      details: "Заказ #ORD-2024-001234, Сумма: 15,500 ₽, Товаров: 3",
      ipAddress: "185.123.45.67",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)",
      affected_entity: "order",
      entity_id: 1234
    },
    {
      id: 4,
      timestamp: "2024-12-15T14:15:12Z",
      eventType: "system",
      severity: "high",
      source: "Database",
      description: "Превышено время ожидания запроса к базе данных",
      details: "Query timeout: SELECT * FROM products WHERE category_id = 15, Duration: 30.5s",
      ipAddress: "localhost",
      affected_entity: "database",
      entity_id: undefined
    },
    {
      id: 5,
      timestamp: "2024-12-15T14:10:08Z",
      eventType: "payment",
      severity: "medium",
      source: "Payment Gateway",
      user: "client2@example.com",
      userId: 456,
      description: "Ошибка обработки платежа",
      details: "Payment declined: Insufficient funds, Amount: 8,750 ₽, Card: ****1234",
      ipAddress: "78.234.56.123",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      affected_entity: "payment",
      entity_id: 5678
    },
    {
      id: 6,
      timestamp: "2024-12-15T14:05:33Z",
      eventType: "error",
      severity: "critical",
      source: "API Server",
      description: "Критическая ошибка API сервера",
      details: "500 Internal Server Error: /api/products/search, Exception: NullPointerException",
      ipAddress: "172.16.0.1",
      affected_entity: "api",
      entity_id: undefined
    },
    {
      id: 7,
      timestamp: "2024-12-15T14:00:15Z",
      eventType: "user_action",
      severity: "low",
      source: "Web Interface",
      user: "manager@autoparts.ru",
      userId: 5,
      description: "Обновлена информация о товаре",
      details: "Товар: Фильтр масляный MANN W 712/75, Изменена цена: 1250 → 1199 ₽",
      ipAddress: "192.168.1.15",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      affected_entity: "product",
      entity_id: 1001
    },
    {
      id: 8,
      timestamp: "2024-12-15T13:55:22Z",
      eventType: "security",
      severity: "high",
      source: "Security Monitor",
      description: "Обнаружена подозрительная активность",
      details: "Multiple failed login attempts from IP: 45.123.67.89, Count: 15 attempts in 5 minutes",
      ipAddress: "45.123.67.89",
      affected_entity: "security",
      entity_id: undefined
    }
  ];

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
      case "user_action":
        return <Badge color="primary" size="sm">Действие пользователя</Badge>;
      case "system":
        return <Badge color="info" size="sm">Система</Badge>;
      case "error":
        return <Badge color="error" size="sm">Ошибка</Badge>;
      case "security":
        return <Badge color="warning" size="sm">Безопасность</Badge>;
      case "order":
        return <Badge color="success" size="sm">Заказ</Badge>;
      case "payment":
        return <Badge color="light" size="sm">Платеж</Badge>;
      default:
        return <Badge color="light" size="sm">{type}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "low":
        return <Badge color="success" size="sm">Низкая</Badge>;
      case "medium":
        return <Badge color="warning" size="sm">Средняя</Badge>;
      case "high":
        return <Badge color="error" size="sm">Высокая</Badge>;
      case "critical":
        return <Badge color="dark" size="sm">Критическая</Badge>;
      default:
        return <Badge color="light" size="sm">{severity}</Badge>;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "low":
        return (
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
        );
      case "medium":
        return (
          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
        );
      case "high":
        return (
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
        );
      case "critical":
        return (
          <div className="w-2 h-2 rounded-full bg-red-700 animate-pulse"></div>
        );
      default:
        return (
          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
        );
    }
  };

  const openEventDetails = (event: EventLog) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const filteredEvents = eventLogs.filter(event => {
    if (activeTab !== "all" && event.eventType !== activeTab) return false;
    if (filterType && event.eventType !== filterType) return false;
    if (filterSeverity && event.severity !== filterSeverity) return false;
    if (searchTerm && !event.description.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !event.user?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const eventTypeOptions = [
    { value: "", label: "Все типы" },
    { value: "user_action", label: "Действия пользователей" },
    { value: "system", label: "Системные события" },
    { value: "error", label: "Ошибки" },
    { value: "security", label: "Безопасность" },
    { value: "order", label: "Заказы" },
    { value: "payment", label: "Платежи" }
  ];

  const severityOptions = [
    { value: "", label: "Все уровни" },
    { value: "low", label: "Низкая" },
    { value: "medium", label: "Средняя" },
    { value: "high", label: "Высокая" },
    { value: "critical", label: "Критическая" }
  ];

  const getEventStats = () => {
    const total = eventLogs.length;
    const critical = eventLogs.filter(e => e.severity === "critical").length;
    const errors = eventLogs.filter(e => e.eventType === "error").length;
    const security = eventLogs.filter(e => e.eventType === "security").length;
    return { total, critical, errors, security };
  };

  const stats = getEventStats();

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Всего событий</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            <div className="ml-2 flex items-center text-sm font-medium text-blue-600">
              <span>за сегодня</span>
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">записей в журнале</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Критические</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.critical}</p>
            {stats.critical > 0 && (
              <div className="ml-2 flex items-center text-sm font-medium text-red-600">
                <span>требуют внимания</span>
              </div>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">критических событий</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Ошибки</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.errors}</p>
            <div className="ml-2 flex items-center text-sm font-medium text-orange-600">
              <span>системных</span>
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">ошибок системы</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Безопасность</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.security}</p>
            <div className="ml-2 flex items-center text-sm font-medium text-yellow-600">
              <span>инцидентов</span>
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">событий безопасности</p>
        </div>
      </div>

      {/* Фильтры */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label>Поиск по описанию или пользователю</Label>
            <Input
              type="text"
              placeholder="Введите текст для поиска..."
              defaultValue={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <Label>Тип события</Label>
            <Select
              options={eventTypeOptions}
              onChange={(value) => setFilterType(value)}
              placeholder="Выберите тип"
            />
          </div>
          <div>
            <Label>Уровень важности</Label>
            <Select
              options={severityOptions}
              onChange={(value) => setFilterSeverity(value)}
              placeholder="Выберите уровень"
            />
          </div>
          <div className="flex items-end">
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setFilterType("");
                setFilterSeverity("");
              }}
              className="w-full"
            >
              Сбросить фильтры
            </Button>
          </div>
        </div>
      </div>

      {/* Основной контент с табами */}
      <ComponentCard
        title="Журнал событий системы"
        description="Мониторинг и анализ всех событий в системе"
        action={
          <div className="flex space-x-2">
            <Button size="sm" variant="outline">Экспорт логов</Button>
            <Button size="sm">Настройки</Button>
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
              Все события
            </button>
            <button
              onClick={() => setActiveTab("user_action")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "user_action"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Действия пользователей
            </button>
            <button
              onClick={() => setActiveTab("system")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "system"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Системные
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "security"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Безопасность
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
          </nav>
        </div>

        {/* Таблица событий */}
        <div className="mt-6">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <div className="min-w-[1200px]">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Время</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Важность</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Тип</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Пользователь</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Описание</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Источник</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Действия</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {filteredEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="px-5 py-4 sm:px-6 text-start">
                          <div className="text-gray-700 text-theme-sm dark:text-gray-300 font-mono">
                            {formatDateTime(event.timestamp)}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start text-theme-sm">
                          <div className="flex items-center space-x-2">
                            {getSeverityIcon(event.severity)}
                            {getSeverityBadge(event.severity)}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start text-theme-sm">
                          {getEventTypeBadge(event.eventType)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start text-theme-sm">
                          {event.user ? (
                            <div>
                              <div className="font-medium text-gray-800 dark:text-white/90">{event.user}</div>
                              <div className="text-gray-500 text-theme-xs dark:text-gray-400">ID: {event.userId}</div>
                            </div>
                          ) : (
                            <span className="text-gray-500 text-theme-xs dark:text-gray-400">Система</span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start text-theme-sm">
                          <div className="max-w-xs">
                            <div className="font-medium text-gray-800 dark:text-white/90 truncate">
                              {event.description}
                            </div>
                            <div className="text-gray-500 text-theme-xs dark:text-gray-400 truncate">
                              IP: {event.ipAddress}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-700 text-start text-theme-sm dark:text-gray-300">
                          <Badge color="light" size="sm">{event.source}</Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEventDetails(event)}
                          >
                            Подробнее
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          
          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 dark:text-gray-400">
                <p className="text-lg font-medium">События не найдены</p>
                <p className="text-sm mt-1">Попробуйте изменить фильтры поиска</p>
              </div>
            </div>
          )}
        </div>
      </ComponentCard>

      {/* Модальное окно с подробностями */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="lg">
        {selectedEvent && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
              Подробности события
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Время события</Label>
                  <div className="font-mono text-sm text-gray-700 dark:text-gray-300">
                    {formatDateTime(selectedEvent.timestamp)}
                  </div>
                </div>
                <div>
                  <Label>Уровень важности</Label>
                  <div>{getSeverityBadge(selectedEvent.severity)}</div>
                </div>
                <div>
                  <Label>Тип события</Label>
                  <div>{getEventTypeBadge(selectedEvent.eventType)}</div>
                </div>
                <div>
                  <Label>Источник</Label>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {selectedEvent.source}
                  </div>
                </div>
              </div>

              <div>
                <Label>Описание</Label>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {selectedEvent.description}
                </div>
              </div>

              <div>
                <Label>Детали события</Label>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300 font-mono">
                  {selectedEvent.details}
                </div>
              </div>

              {selectedEvent.user && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Пользователь</Label>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedEvent.user}
                    </div>
                  </div>
                  <div>
                    <Label>ID пользователя</Label>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedEvent.userId}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>IP адрес</Label>
                  <div className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                    {selectedEvent.ipAddress}
                  </div>
                </div>
                {selectedEvent.userAgent && (
                  <div>
                    <Label>User Agent</Label>
                    <div className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {selectedEvent.userAgent}
                    </div>
                  </div>
                )}
              </div>

              {selectedEvent.affected_entity && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Затронутая сущность</Label>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedEvent.affected_entity}
                    </div>
                  </div>
                  {selectedEvent.entity_id && (
                    <div>
                      <Label>ID сущности</Label>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {selectedEvent.entity_id}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-6">
              <Button onClick={() => setIsModalOpen(false)}>
                Закрыть
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EventLogPage;
