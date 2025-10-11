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
import { eventLogApi, EventLog } from "@/lib/api/event-log";
import { logPageView } from "@/lib/eventLogger";

const EventLogPage = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventLog | null>(null);
  const [filterType, setFilterType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEventLogs();
    // Log page view
    logPageView('Журнал событий', '/event-log');
  }, []);

  const loadEventLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await eventLogApi.getEventLogs(0, 100, 'createdAt,desc');
      setEventLogs(data.content || []);
    } catch (e: any) {
      setError(e.message || "Не удалось загрузить журнал событий");
      setEventLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const createTestEvent = async () => {
    try {
      const response = await fetch(ADMIN_EVENT_TEST_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        alert('Тестовое реальное событие создано!');
        loadEventLogs(); // Reload the page
      } else {
        alert('Ошибка создания события');
      }
    } catch (error) {
      console.error('Failed to create test event:', error);
      alert('Ошибка создания события');
    }
  };

  const clearSampleData = async () => {
    if (!confirm('Вы уверены, что хотите очистить все события?')) {
      return;
    }
    
    try {
      const response = await fetch(ADMIN_EVENT_LOG_URL, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        alert('Все события очищены!');
        loadEventLogs();
      } else {
        alert('Ошибка очистки данных');
      }
    } catch (error) {
      console.error('Failed to clear data:', error);
      alert('Ошибка очистки данных');
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
        return <Badge color="primary" size="sm">Пользователь</Badge>;
      case "SYSTEM_BACKUP":
      case "SYSTEM_RESTART":
        return <Badge color="info" size="sm">Система</Badge>;
      case "ERROR_OCCURRED":
        return <Badge color="error" size="sm">Ошибка</Badge>;
      case "SECURITY_EVENT":
        return <Badge color="warning" size="sm">Безопасность</Badge>;
      case "ORDER_CREATED":
      case "ORDER_UPDATED":
      case "ORDER_CANCELLED":
        return <Badge color="success" size="sm">Заказ</Badge>;
      case "PAYMENT_COMPLETED":
      case "PAYMENT_FAILED":
      case "REFUND_ISSUED":
        return <Badge color="light" size="sm">Платеж</Badge>;
      default:
        return <Badge color="light" size="sm">{type}</Badge>;
    }
  };

  const getSuccessBadge = (success: boolean) => {
    return success 
      ? <Badge color="success" size="sm">Успешно</Badge>
      : <Badge color="error" size="sm">Ошибка</Badge>;
  };

  const getSuccessIcon = (success: boolean) => {
    return success 
      ? <div className="w-2 h-2 rounded-full bg-green-500"></div>
      : <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>;
  };

  const openEventDetails = (event: EventLog) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const filteredEvents = eventLogs.filter(event => {
    if (activeTab !== "all" && event.eventType !== activeTab) return false;
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
    const total = eventLogs.length;
    const errors = eventLogs.filter(e => !e.success).length;
    const security = eventLogs.filter(e => e.eventType === "SECURITY_EVENT").length;
    const systemEvents = eventLogs.filter(e => e.eventType === "SYSTEM_BACKUP" || e.eventType === "SYSTEM_RESTART").length;
    return { total, errors, security, systemEvents };
  };

  const stats = getEventStats();

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            <p className="text-lg font-medium">Загрузка журнала событий...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Статистика */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Всего событий</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">записей в журнале</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Ошибки</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.errors}</p>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">неуспешных операций</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Безопасность</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.security}</p>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">события безопасности</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Система</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.systemEvents}</p>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">системных событий</p>
            </div>
          </div>

          {/* Фильтры */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Поиск по описанию или пользователю</Label>
                <Input
                  type="text"
                  placeholder="Введите текст для поиска..."
                  value={searchTerm}
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
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("");
                    setFilterType("");
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
            title="Журнал событий системы"
            description="Мониторинг и анализ системных событий"
            action={
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={loadEventLogs}>Обновить</Button>
                <Button size="sm" variant="outline" onClick={createTestEvent}>Создать тестовое событие</Button>
                <Button size="sm" variant="outline" onClick={clearSampleData}>Очистить все</Button>
                <Button size="sm" variant="outline">Экспорт</Button>
              </div>
            }
          >
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Время</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Тип</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Описание</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Пользователь</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Статус</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Действия</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {filteredEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="px-5 py-4 sm:px-6 text-start">
                          <div className="text-gray-700 text-theme-sm dark:text-gray-300 font-mono">
                            {formatDateTime(event.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start text-theme-sm">
                          <div className="flex items-center space-x-2">
                            {getSuccessIcon(event.success)}
                            {getEventTypeBadge(event.eventType)}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start text-theme-sm">
                          <div className="max-w-md">
                            <div className="font-medium text-gray-800 dark:text-white/90 line-clamp-2">
                              {event.description}
                            </div>
                            <div className="text-gray-500 text-theme-xs dark:text-gray-400 truncate mt-1">
                              {event.details}
                            </div>
                            <div className="text-gray-500 text-theme-xs dark:text-gray-400 truncate">
                              IP: {event.ipAddress}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <div className="font-medium text-gray-800 dark:text-white/90">
                            {event.userName || 'Система'}
                          </div>
                          <div className="text-gray-500 text-theme-xs dark:text-gray-400">ID: {event.userId}</div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start text-theme-sm">
                          {getSuccessBadge(event.success)}
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

            {filteredEvents.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 dark:text-gray-400">
                  <p className="text-lg font-medium">События не найдены</p>
                  <p className="text-sm mt-1">Попробуйте изменить фильтры поиска</p>
                </div>
              </div>
            )}
          </ComponentCard>

          {/* Модальное окно с подробностями события */}
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
                        {formatDateTime(selectedEvent.createdAt)}
                      </div>
                    </div>
                    <div>
                      <Label>Тип события</Label>
                      <div>{getEventTypeBadge(selectedEvent.eventType)}</div>
                    </div>
                    <div>
                      <Label>Статус выполнения</Label>
                      <div>{getSuccessBadge(selectedEvent.success)}</div>
                    </div>
                    <div>
                      <Label>Пользователь</Label>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {selectedEvent.userName || 'Система'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Описание</Label>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300">
                      {selectedEvent.description}
                    </div>
                  </div>

                  {selectedEvent.details && (
                    <div>
                      <Label>Детали</Label>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300">
                        {selectedEvent.details}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>IP адрес</Label>
                      <div className="font-mono text-sm text-gray-700 dark:text-gray-300">
                        {selectedEvent.ipAddress || 'Не указан'}
                      </div>
                    </div>
                    <div>
                      <Label>User Agent</Label>
                      <div className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {selectedEvent.userAgent || 'Не указан'}
                      </div>
                    </div>
                  </div>

                  {selectedEvent.errorMessage && (
                    <div>
                      <Label>Сообщение об ошибке</Label>
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-800 dark:text-red-300">
                        {selectedEvent.errorMessage}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-6">
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

export default EventLogPage;
const ADMIN_EVENT_LOG_URL = `${API_URL}/api/admin/event-logs`;
const ADMIN_EVENT_TEST_URL = `${ADMIN_EVENT_LOG_URL}/test-real-event`;
