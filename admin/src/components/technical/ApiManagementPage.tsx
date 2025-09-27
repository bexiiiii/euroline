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

interface ApiEndpoint {
  id: number;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  name: string;
  description: string;
  status: "active" | "inactive" | "deprecated";
  version: string;
  rateLimit: number;
  authentication: "none" | "api_key" | "bearer" | "basic";
  lastCalled: string;
  callCount: number;
  averageResponseTime: number;
  errorRate: number;
  category: string;
}

interface ApiKey {
  id: number;
  name: string;
  key: string;
  status: "active" | "inactive" | "revoked";
  permissions: string[];
  rateLimit: number;
  createdAt: string;
  lastUsed: string;
  expiresAt: string;
  usageCount: number;
  owner: string;
}

const ApiManagementPage = () => {
  const [activeTab, setActiveTab] = useState("endpoints");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"endpoint" | "key">("endpoint");
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [endpoints] = useState<ApiEndpoint[]>([
    {
      id: 1,
      method: "GET",
      path: "/api/v1/products",
      name: "Получить список товаров",
      description: "Возвращает список всех товаров с пагинацией и фильтрами",
      status: "active",
      version: "v1",
      rateLimit: 1000,
      authentication: "api_key",
      lastCalled: "2024-12-15T14:30:00Z",
      callCount: 15420,
      averageResponseTime: 145,
      errorRate: 0.5,
      category: "products"
    },
    {
      id: 2,
      method: "POST",
      path: "/api/v1/orders",
      name: "Создать заказ",
      description: "Создает новый заказ на основе переданных данных",
      status: "active",
      version: "v1",
      rateLimit: 100,
      authentication: "bearer",
      lastCalled: "2024-12-15T14:25:00Z",
      callCount: 3210,
      averageResponseTime: 320,
      errorRate: 2.1,
      category: "orders"
    },
    {
      id: 3,
      method: "GET",
      path: "/api/v1/categories",
      name: "Получить категории",
      description: "Возвращает дерево категорий товаров",
      status: "active",
      version: "v1",
      rateLimit: 500,
      authentication: "none",
      lastCalled: "2024-12-15T14:20:00Z",
      callCount: 8500,
      averageResponseTime: 85,
      errorRate: 0.1,
      category: "categories"
    },
    {
      id: 4,
      method: "PUT",
      path: "/api/v1/products/{id}",
      name: "Обновить товар",
      description: "Обновляет информацию о товаре",
      status: "active",
      version: "v1",
      rateLimit: 200,
      authentication: "api_key",
      lastCalled: "2024-12-15T13:45:00Z",
      callCount: 890,
      averageResponseTime: 210,
      errorRate: 1.2,
      category: "products"
    },
    {
      id: 5,
      method: "GET",
      path: "/api/v0/legacy/products",
      name: "Получить товары (устаревший)",
      description: "Устаревший метод получения товаров",
      status: "deprecated",
      version: "v0",
      rateLimit: 50,
      authentication: "basic",
      lastCalled: "2024-12-10T10:00:00Z",
      callCount: 150,
      averageResponseTime: 500,
      errorRate: 5.0,
      category: "products"
    }
  ]);

  const [apiKeys] = useState<ApiKey[]>([
    {
      id: 1,
      name: "Mobile App Key",
      key: "ak_live_51H8B...***...XYZ9",
      status: "active",
      permissions: ["products:read", "categories:read", "orders:create"],
      rateLimit: 1000,
      createdAt: "2024-11-01T10:00:00Z",
      lastUsed: "2024-12-15T14:30:00Z",
      expiresAt: "2025-11-01T10:00:00Z",
      usageCount: 45230,
      owner: "mobile-team@autoparts.ru"
    },
    {
      id: 2,
      name: "Admin Dashboard",
      key: "ak_live_52J9C...***...ABC1",
      status: "active",
      permissions: ["*"],
      rateLimit: 5000,
      createdAt: "2024-10-15T09:00:00Z",
      lastUsed: "2024-12-15T14:25:00Z",
      expiresAt: "2025-10-15T09:00:00Z",
      usageCount: 128450,
      owner: "admin@autoparts.ru"
    },
    {
      id: 3,
      name: "Third Party Integration",
      key: "ak_test_53K0D...***...DEF2",
      status: "inactive",
      permissions: ["products:read", "categories:read"],
      rateLimit: 100,
      createdAt: "2024-12-01T15:00:00Z",
      lastUsed: "2024-12-05T12:00:00Z",
      expiresAt: "2024-12-31T23:59:59Z",
      usageCount: 25,
      owner: "partner@example.com"
    }
  ]);

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "success";
      case "POST":
        return "primary";
      case "PUT":
        return "warning";
      case "DELETE":
        return "error";
      case "PATCH":
        return "info";
      default:
        return "light";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge color="success" size="sm">Активен</Badge>;
      case "inactive":
        return <Badge color="warning" size="sm">Неактивен</Badge>;
      case "deprecated":
        return <Badge color="error" size="sm">Устарел</Badge>;
      case "revoked":
        return <Badge color="error" size="sm">Отозван</Badge>;
      default:
        return <Badge color="light" size="sm">{status}</Badge>;
    }
  };

  const getAuthBadge = (auth: string) => {
    switch (auth) {
      case "none":
        return <Badge color="light" size="sm">Без авторизации</Badge>;
      case "api_key":
        return <Badge color="primary" size="sm">API Ключ</Badge>;
      case "bearer":
        return <Badge color="info" size="sm">Bearer Token</Badge>;
      case "basic":
        return <Badge color="warning" size="sm">Basic Auth</Badge>;
      default:
        return <Badge color="light" size="sm">{auth}</Badge>;
    }
  };

  const openModal = (type: "endpoint" | "key", item?: any) => {
    setModalType(type);
    setSelectedItem(item || null);
    setIsModalOpen(true);
  };

  const getApiStats = () => {
    const totalEndpoints = endpoints.length;
    const activeEndpoints = endpoints.filter(e => e.status === "active").length;
    const totalCalls = endpoints.reduce((sum, e) => sum + e.callCount, 0);
    const avgResponseTime = endpoints.reduce((sum, e) => sum + e.averageResponseTime, 0) / endpoints.length;
    const totalKeys = apiKeys.length;
    const activeKeys = apiKeys.filter(k => k.status === "active").length;
    
    return {
      totalEndpoints,
      activeEndpoints,
      totalCalls,
      avgResponseTime: Math.round(avgResponseTime),
      totalKeys,
      activeKeys
    };
  };

  const stats = getApiStats();

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">API Endpoints</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.activeEndpoints}</p>
            <div className="ml-2 flex items-center text-sm font-medium text-gray-500">
              <span>из {stats.totalEndpoints}</span>
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">активных endpoints</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Всего вызовов</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {stats.totalCalls.toLocaleString('ru-RU')}
            </p>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">запросов к API</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Время ответа</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.avgResponseTime}</p>
            <div className="ml-2 flex items-center text-sm font-medium text-green-600">
              <span>мс</span>
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">среднее время</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">API Ключи</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.activeKeys}</p>
            <div className="ml-2 flex items-center text-sm font-medium text-gray-500">
              <span>из {stats.totalKeys}</span>
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">активных ключей</p>
        </div>
      </div>

      {/* Основной контент */}
      <ComponentCard
        title="Управление API"
        description="Настройка endpoints, API ключей и мониторинг использования"
        action={
          <div className="flex space-x-2">
            <Button size="sm" variant="outline">Документация</Button>
            <Button size="sm" onClick={() => openModal(activeTab === "endpoints" ? "endpoint" : "key")}>
              {activeTab === "endpoints" ? "Добавить Endpoint" : "Создать ключ"}
            </Button>
          </div>
        }
      >
        {/* Табы */}
        <div className="border-b border-gray-200 dark:border-gray-700 -mx-6 px-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("endpoints")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "endpoints"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              API Endpoints
            </button>
            <button
              onClick={() => setActiveTab("keys")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "keys"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              API Ключи
            </button>
          </nav>
        </div>

        {/* Контент табов */}
        <div className="mt-6">
          {activeTab === "endpoints" && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <div className="min-w-[1400px]">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                      <TableRow>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Endpoint</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Статус</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Авторизация</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Лимит запросов</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Статистика</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Последний вызов</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Действия</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {endpoints.map((endpoint) => (
                        <TableRow key={endpoint.id}>
                          <TableCell className="px-5 py-4 sm:px-6 text-start">
                            <div>
                              <div className="flex items-center space-x-2">
                                <Badge color={getMethodColor(endpoint.method) as any} size="sm">
                                  {endpoint.method}
                                </Badge>
                                <span className="font-mono text-gray-800 text-theme-sm dark:text-white/90">
                                  {endpoint.path}
                                </span>
                              </div>
                              <div className="font-medium text-gray-800 text-theme-sm dark:text-white/90 mt-1">
                                {endpoint.name}
                              </div>
                              <div className="text-gray-500 text-theme-xs dark:text-gray-400 mt-1">
                                {endpoint.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start text-theme-sm">
                            {getStatusBadge(endpoint.status)}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start text-theme-sm">
                            {getAuthBadge(endpoint.authentication)}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start text-theme-sm">
                            <div className="text-gray-700 dark:text-gray-300">
                              {endpoint.rateLimit.toLocaleString('ru-RU')}/час
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start text-theme-sm">
                            <div>
                              <div className="text-gray-700 dark:text-gray-300">
                                {endpoint.callCount.toLocaleString('ru-RU')} вызовов
                              </div>
                              <div className="text-gray-500 text-theme-xs dark:text-gray-400">
                                ~{endpoint.averageResponseTime}мс • {endpoint.errorRate}% ошибок
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start text-theme-sm">
                            <div className="text-gray-700 dark:text-gray-300">
                              {formatDateTime(endpoint.lastCalled)}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openModal("endpoint", endpoint)}
                            >
                              Настроить
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "keys" && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <div className="min-w-[1200px]">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                      <TableRow>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Ключ</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Статус</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Разрешения</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Использование</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Истекает</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Действия</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {apiKeys.map((key) => (
                        <TableRow key={key.id}>
                          <TableCell className="px-5 py-4 sm:px-6 text-start">
                            <div>
                              <div className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                {key.name}
                              </div>
                              <div className="font-mono text-gray-500 text-theme-xs dark:text-gray-400 mt-1">
                                {key.key}
                              </div>
                              <div className="text-gray-500 text-theme-xs dark:text-gray-400 mt-1">
                                Владелец: {key.owner}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start text-theme-sm">
                            {getStatusBadge(key.status)}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start text-theme-sm">
                            <div className="max-w-xs">
                              {key.permissions.slice(0, 2).map((perm, idx) => (
                                <span key={idx} className="mr-1 mb-1 inline-block">
                                  <Badge color="light" size="sm">
                                    {perm}
                                  </Badge>
                                </span>
                              ))}
                              {key.permissions.length > 2 && (
                                <span className="text-gray-500 text-theme-xs">
                                  +{key.permissions.length - 2} еще
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start text-theme-sm">
                            <div>
                              <div className="text-gray-700 dark:text-gray-300">
                                {key.usageCount.toLocaleString('ru-RU')} вызовов
                              </div>
                              <div className="text-gray-500 text-theme-xs dark:text-gray-400">
                                Лимит: {key.rateLimit.toLocaleString('ru-RU')}/час
                              </div>
                              <div className="text-gray-500 text-theme-xs dark:text-gray-400">
                                Последний: {formatDateTime(key.lastUsed)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start text-theme-sm">
                            <div className="text-gray-700 dark:text-gray-300">
                              {formatDateTime(key.expiresAt)}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start">
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openModal("key", key)}
                              >
                                Настроить
                              </Button>
                              {key.status === "active" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                >
                                  Отозвать
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
          )}
        </div>
      </ComponentCard>

      {/* Модальное окно */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="md">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
            {modalType === "endpoint" ? "Настройка Endpoint" : "Настройка API ключа"}
          </h3>
          <div className="text-gray-600 dark:text-gray-400">
            Форма настройки будет здесь...
          </div>
          <div className="flex justify-end pt-6">
            <Button onClick={() => setIsModalOpen(false)}>
              Закрыть
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ApiManagementPage;
