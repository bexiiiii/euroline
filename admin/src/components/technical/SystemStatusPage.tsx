"use client";
import React, { useState, useEffect } from "react";
import ComponentCard from "../common/ComponentCard";
import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";
import { Modal } from "../ui/modal";

interface SystemService {
  id: string;
  name: string;
  status: "online" | "offline" | "warning" | "maintenance";
  uptime: number;
  responseTime: number;
  lastCheck: string;
  description: string;
  url?: string;
  port?: number;
  dependencies: string[];
}

interface SystemMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  threshold: {
    warning: number;
    critical: number;
  };
  trend: "up" | "down" | "stable";
  lastUpdated: string;
}

const SystemStatusPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<SystemService | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const [services] = useState<SystemService[]>([
    {
      id: "web-server",
      name: "Web Server (Nginx)",
      status: "online",
      uptime: 99.98,
      responseTime: 145,
      lastCheck: "2024-12-15T14:30:00Z",
      description: "Основной веб-сервер для обработки HTTP запросов",
      url: "https://autoparts.ru",
      port: 443,
      dependencies: []
    },
    {
      id: "database",
      name: "База данных (PostgreSQL)",
      status: "online",
      uptime: 99.95,
      responseTime: 12,
      lastCheck: "2024-12-15T14:30:00Z",
      description: "Основная база данных приложения",
      port: 5432,
      dependencies: []
    },
    {
      id: "redis",
      name: "Кэш сервер (Redis)",
      status: "online",
      uptime: 99.99,
      responseTime: 2,
      lastCheck: "2024-12-15T14:30:00Z",
      description: "Сервер кэширования и сессий",
      port: 6379,
      dependencies: []
    },
    {
      id: "elasticsearch",
      name: "Поиск (Elasticsearch)",
      status: "warning",
      uptime: 98.5,
      responseTime: 250,
      lastCheck: "2024-12-15T14:30:00Z",
      description: "Система полнотекстового поиска",
      port: 9200,
      dependencies: []
    },
    {
      id: "payment-gateway",
      name: "Платежный шлюз",
      status: "online",
      uptime: 99.8,
      responseTime: 850,
      lastCheck: "2024-12-15T14:30:00Z",
      description: "Интеграция с платежными системами",
      url: "https://api.sberbank.ru",
      dependencies: ["web-server"]
    },
    {
      id: "email-service",
      name: "Email сервис",
      status: "online",
      uptime: 99.9,
      responseTime: 320,
      lastCheck: "2024-12-15T14:30:00Z",
      description: "Сервис отправки электронной почты",
      dependencies: ["web-server"]
    },
    {
      id: "backup-system",
      name: "Система резервного копирования",
      status: "maintenance",
      uptime: 100,
      responseTime: 0,
      lastCheck: "2024-12-15T14:00:00Z",
      description: "Автоматическое резервное копирование данных",
      dependencies: ["database"]
    },
    {
      id: "monitoring",
      name: "Система мониторинга",
      status: "online",
      uptime: 99.99,
      responseTime: 45,
      lastCheck: "2024-12-15T14:30:00Z",
      description: "Мониторинг состояния всех сервисов",
      dependencies: []
    }
  ]);

  const [metrics] = useState<SystemMetric[]>([
    {
      id: "cpu-usage",
      name: "Загрузка CPU",
      value: 35.2,
      unit: "%",
      threshold: { warning: 70, critical: 90 },
      trend: "stable",
      lastUpdated: "2024-12-15T14:30:00Z"
    },
    {
      id: "memory-usage",
      name: "Использование памяти",
      value: 68.5,
      unit: "%",
      threshold: { warning: 80, critical: 95 },
      trend: "up",
      lastUpdated: "2024-12-15T14:30:00Z"
    },
    {
      id: "disk-usage",
      name: "Использование диска",
      value: 42.8,
      unit: "%",
      threshold: { warning: 85, critical: 95 },
      trend: "stable",
      lastUpdated: "2024-12-15T14:30:00Z"
    },
    {
      id: "network-io",
      name: "Сетевой трафик",
      value: 125.3,
      unit: "Mbps",
      threshold: { warning: 800, critical: 950 },
      trend: "down",
      lastUpdated: "2024-12-15T14:30:00Z"
    },
    {
      id: "active-users",
      name: "Активных пользователей",
      value: 487,
      unit: "чел.",
      threshold: { warning: 1000, critical: 1200 },
      trend: "up",
      lastUpdated: "2024-12-15T14:30:00Z"
    },
    {
      id: "db-connections",
      name: "Подключений к БД",
      value: 25,
      unit: "шт.",
      threshold: { warning: 80, critical: 95 },
      trend: "stable",
      lastUpdated: "2024-12-15T14:30:00Z"
    }
  ]);

  // Автообновление каждые 30 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);

    return () => clearInterval(interval);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return <Badge color="success" size="sm">Онлайн</Badge>;
      case "offline":
        return <Badge color="error" size="sm">Офлайн</Badge>;
      case "warning":
        return <Badge color="warning" size="sm">Предупреждение</Badge>;
      case "maintenance":
        return <Badge color="info" size="sm">Обслуживание</Badge>;
      default:
        return <Badge color="light" size="sm">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>;
      case "offline":
        return <div className="w-3 h-3 rounded-full bg-red-500"></div>;
      case "warning":
        return <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"></div>;
      case "maintenance":
        return <div className="w-3 h-3 rounded-full bg-blue-500"></div>;
      default:
        return <div className="w-3 h-3 rounded-full bg-gray-400"></div>;
    }
  };

  const getMetricStatus = (metric: SystemMetric) => {
    if (metric.value >= metric.threshold.critical) return "critical";
    if (metric.value >= metric.threshold.warning) return "warning";
    return "normal";
  };

  const getMetricColor = (metric: SystemMetric) => {
    const status = getMetricStatus(metric);
    switch (status) {
      case "critical":
        return "text-red-600 dark:text-red-400";
      case "warning":
        return "text-yellow-600 dark:text-yellow-400";
      default:
        return "text-green-600 dark:text-green-400";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return (
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        );
      case "down":
        return (
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const openServiceDetails = (service: SystemService) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const getOverallStatus = () => {
    const onlineCount = services.filter(s => s.status === "online").length;
    const offlineCount = services.filter(s => s.status === "offline").length;
    const warningCount = services.filter(s => s.status === "warning").length;
    const maintenanceCount = services.filter(s => s.status === "maintenance").length;
    
    if (offlineCount > 0) return "critical";
    if (warningCount > 0) return "warning";
    if (maintenanceCount > 0) return "maintenance";
    return "operational";
  };

  const getOverallStatusText = () => {
    switch (getOverallStatus()) {
      case "critical":
        return "Проблемы в работе";
      case "warning":
        return "Частичные проблемы";
      case "maintenance":
        return "Плановое обслуживание";
      default:
        return "Все системы работают";
    }
  };

  const getOverallStatusColor = () => {
    switch (getOverallStatus()) {
      case "critical":
        return "text-red-600 dark:text-red-400";
      case "warning":
        return "text-yellow-600 dark:text-yellow-400";
      case "maintenance":
        return "text-blue-600 dark:text-blue-400";
      default:
        return "text-green-600 dark:text-green-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Общий статус */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-4 h-4 rounded-full ${
              getOverallStatus() === "operational" ? "bg-green-500 animate-pulse" :
              getOverallStatus() === "warning" ? "bg-yellow-500 animate-pulse" :
              getOverallStatus() === "maintenance" ? "bg-blue-500" :
              "bg-red-500 animate-pulse"
            }`}></div>
            <div>
              <h2 className={`text-2xl font-bold ${getOverallStatusColor()}`}>
                {getOverallStatusText()}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Последнее обновление: {lastUpdate.toLocaleString('ru-RU')}
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => setLastUpdate(new Date())}>
              Обновить
            </Button>
            <Button>
              Настройки мониторинга
            </Button>
          </div>
        </div>
      </div>

      {/* Системные метрики */}
      <ComponentCard
        title="Системные метрики"
        description="Ключевые показатели производительности системы"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metrics.map((metric) => (
            <div key={metric.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {metric.name}
                </h3>
                {getTrendIcon(metric.trend)}
              </div>
              <div className="flex items-baseline space-x-2">
                <span className={`text-2xl font-bold ${getMetricColor(metric)}`}>
                  {metric.value}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {metric.unit}
                </span>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      getMetricStatus(metric) === "critical" ? "bg-red-500" :
                      getMetricStatus(metric) === "warning" ? "bg-yellow-500" :
                      "bg-green-500"
                    }`}
                    style={{
                      width: `${Math.min((metric.value / metric.threshold.critical) * 100, 100)}%`
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>0</span>
                  <span>Предупреждение: {metric.threshold.warning}{metric.unit}</span>
                  <span>Критично: {metric.threshold.critical}{metric.unit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ComponentCard>

      {/* Статус сервисов */}
      <ComponentCard
        title="Статус сервисов"
        description="Состояние всех компонентов системы"
        action={
          <div className="flex space-x-2">
            <Button size="sm" variant="outline">Настроить проверки</Button>
            <Button size="sm">Добавить сервис</Button>
          </div>
        }
      >
        <div className="space-y-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              onClick={() => openServiceDetails(service)}
            >
              <div className="flex items-center space-x-4">
                {getStatusIcon(service.status)}
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {service.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {service.description}
                  </p>
                  {service.dependencies.length > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Зависимости: {service.dependencies.join(", ")}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-4 text-right">
                <div>
                  {getStatusBadge(service.status)}
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Uptime: {service.uptime}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Ответ: {service.responseTime}мс
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </ComponentCard>

      {/* Быстрые действия */}
      <ComponentCard
        title="Быстрые действия"
        description="Управление системой и диагностика"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button variant="outline" className="p-6 h-auto flex-col space-y-2">
            <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Перезапуск сервисов</span>
          </Button>
          
          <Button variant="outline" className="p-6 h-auto flex-col space-y-2">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15.586 13H14a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Полная диагностика</span>
          </Button>
          
          <Button variant="outline" className="p-6 h-auto flex-col space-y-2">
            <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Создать бэкап</span>
          </Button>
          
          <Button variant="outline" className="p-6 h-auto flex-col space-y-2">
            <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Режим обслуживания</span>
          </Button>
        </div>
      </ComponentCard>

      {/* Модальное окно с деталями сервиса */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="lg">
        {selectedService && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
              Детали сервиса: {selectedService.name}
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Статус
                  </label>
                  <div>{getStatusBadge(selectedService.status)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Время работы
                  </label>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {selectedService.uptime}%
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Время отклика
                  </label>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {selectedService.responseTime} мс
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Последняя проверка
                  </label>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {formatDateTime(selectedService.lastCheck)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Описание
                </label>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {selectedService.description}
                </div>
              </div>

              {selectedService.url && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    URL
                  </label>
                  <div className="font-mono text-sm text-gray-700 dark:text-gray-300">
                    {selectedService.url}
                  </div>
                </div>
              )}

              {selectedService.port && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Порт
                  </label>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {selectedService.port}
                  </div>
                </div>
              )}

              {selectedService.dependencies.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Зависимости
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedService.dependencies.map((dep, idx) => (
                      <Badge key={idx} color="light" size="sm">
                        {dep}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <Button variant="outline">Запустить проверку</Button>
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

export default SystemStatusPage;
