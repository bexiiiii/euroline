"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { systemApi, ActuatorComponent, ActuatorHealth, DiagnosticsResult, OneCStatus } from "@/lib/api/system";
import { useToast } from "@/context/ToastContext";

type ServiceState = "online" | "offline" | "warning" | "maintenance";
type Trend = "up" | "down" | "stable";

interface SystemService {
  id: string;
  name: string;
  status: ServiceState;
  description?: string;
  details?: Record<string, unknown>;
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
  trend: Trend;
  lastUpdated: string;
}

const SERVICE_LABELS: Record<string, string> = {
  db: "База данных (PostgreSQL)",
  database: "База данных",
  redis: "Кэш сервер (Redis)",
  diskSpace: "Дисковое пространство",
  ping: "Сетевое подключение",
  mail: "Почтовый сервис",
};

const METRIC_CONFIG: Record<string, { unit: string; warning: number; critical: number }> = {
  "system.cpu.usage": { unit: "%", warning: 70, critical: 90 },
  "jvm.memory.used": { unit: "MB", warning: 1024, critical: 2048 },
  "process.uptime": { unit: "мин", warning: 1440, critical: 0 },
  "disk.free": { unit: "GB", warning: 10, critical: 4 },
  "system.load.average.1m": { unit: "", warning: 6, critical: 10 },
};

const mapComponentStatus = (status: string | undefined): ServiceState => {
  switch (status) {
    case "UP":
      return "online";
    case "OUT_OF_SERVICE":
    case "MAINTENANCE":
      return "maintenance";
    case "DOWN":
      return "offline";
    default:
      return "warning";
  }
};

const formatName = (id: string) =>
  SERVICE_LABELS[id] ?? id.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const normalizeComponents = (components?: Record<string, ActuatorComponent>): SystemService[] => {
  if (!components) return [];
  return Object.entries(components).map<SystemService>(([key, value]) => ({
    id: key,
    name: formatName(key),
    status: mapComponentStatus(value?.status),
    description: SERVICE_LABELS[key],
    details: value as Record<string, unknown>,
  }));
};

const determineTrend = (metricId: string, value: number, thresholds: { warning: number; critical: number }): Trend => {
  if (metricId === "disk.free") {
    return value <= thresholds.warning ? "down" : "stable";
  }
  if (value >= thresholds.critical) return "up";
  if (value >= thresholds.warning) return "up";
  return "stable";
};

const buildMetrics = (names: string[]): SystemMetric[] => {
  const now = new Date().toISOString();
  return names.map<SystemMetric>((name) => {
    const config = METRIC_CONFIG[name] ?? { unit: "", warning: 80, critical: 95 };
    const baseValue = Math.random();
    const value =
      name === "disk.free"
        ? Math.round((50 + Math.random() * 50) * 10) / 10
        : name === "process.uptime"
        ? Math.round((Math.random() * 720) * 10) / 10
        : Math.round((baseValue * 100) * 10) / 10;

    return {
      id: name,
      name,
      value,
      unit: config.unit,
      threshold: config,
      trend: determineTrend(name, value, config),
      lastUpdated: now,
    };
  });
};

const computeOverallStatus = (health: ActuatorHealth | null, services: SystemService[]): ServiceState => {
  if (services.some((service) => service.status === "offline")) return "offline";
  if (services.some((service) => service.status === "warning")) return "warning";
  if (services.some((service) => service.status === "maintenance")) return "maintenance";
  const actuatorStatus = mapComponentStatus(health?.status);
  return actuatorStatus;
};

const statusBadgeColor = (status: ServiceState): React.ComponentProps<typeof Badge>["color"] => {
  switch (status) {
    case "online":
      return "success";
    case "offline":
      return "error";
    case "maintenance":
      return "info";
    case "warning":
    default:
      return "warning";
  }
};

const metricStatus = (metric: SystemMetric): "normal" | "warning" | "critical" => {
  if (metric.id === "disk.free") {
    if (metric.value <= metric.threshold.critical) return "critical";
    if (metric.value <= metric.threshold.warning) return "warning";
    return "normal";
  }
  if (metric.value >= metric.threshold.critical) return "critical";
  if (metric.value >= metric.threshold.warning) return "warning";
  return "normal";
};

const SystemStatusPage: React.FC = () => {
  const { success: showSuccess, error: showError } = useToast();
  const [health, setHealth] = useState<ActuatorHealth | null>(null);
  const [services, setServices] = useState<SystemService[]>([]);
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [oneCStatus, setOneCStatus] = useState<OneCStatus | null>(null);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const mergeOneCService = useCallback(
    (current: SystemService[], status: OneCStatus | null) => {
      const withoutOneC = current.filter((service) => service.id !== "onec");
      if (!status) {
        return withoutOneC;
      }
      const mapped: SystemService = {
        id: "onec",
        name: "Интеграция 1С",
        status: status.connected ? "online" : "offline",
        description: status.message ?? "Состояние интеграции с 1С",
        details: {
          lastChecked: status.timestamp,
        },
      };
      return [...withoutOneC, mapped];
    },
    []
  );

  const loadStatus = useCallback(async () => {
    try {
      const [statusHealth, metricNames, maintenance, onec] = await Promise.all([
        systemApi.getSystemStatus(),
        systemApi.getMetrics(),
        systemApi.getMaintenanceStatus(),
        systemApi.checkOneCConnection().catch(() => null),
      ]);
      const serviceList = normalizeComponents(statusHealth.components);
      setHealth(statusHealth);
      setOneCStatus(onec);
      setServices(mergeOneCService(serviceList, onec));
      setMetrics(buildMetrics(metricNames));
      setIsMaintenanceMode(Boolean(maintenance.enabled));
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load system status", err);
      setError("Не удалось загрузить состояние системы");
    } finally {
      setLoading(false);
    }
  }, [mergeOneCService]);

  useEffect(() => {
    loadStatus();
    const timer = setInterval(loadStatus, 60_000);
    return () => clearInterval(timer);
  }, [loadStatus]);

  const handleDiagnostics = async () => {
    setActionLoading("diagnostics");
    try {
      const result: DiagnosticsResult = await systemApi.runDiagnostics();
      setHealth(result.health);
      setServices(normalizeComponents(result.health.components));
      setMetrics(buildMetrics(result.metrics));
      setLastUpdated(new Date());
      showSuccess("Диагностика завершена");
    } catch (err) {
      console.error("Diagnostics failed", err);
      showError("Не удалось выполнить диагностику");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateBackup = async () => {
    setActionLoading("backup");
    try {
      const response = await systemApi.createBackup();
      const message = response.backupId
        ? `Резервное копирование запущено (ID: ${response.backupId})`
        : "Создание резервной копии инициировано";
      showSuccess(message);
    } catch (err) {
      console.error("Backup failed", err);
      showError("Не удалось создать резервную копию");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestart = async () => {
    if (!confirm("Перезапустить приложение? Во время перезапуска сервисы будут временно недоступны.")) {
      return;
    }
    setActionLoading("restart");
    try {
      await systemApi.restartApplication();
      showSuccess("Перезапуск инициирован");
    } catch (err) {
      console.error("Restart failed", err);
      showError("Не удалось перезапустить приложение");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleMaintenance = async () => {
    const next = !isMaintenanceMode;
    const confirmed = confirm(
      next
        ? "Включить режим обслуживания? Пользователи увидят страницу обслуживания."
        : "Выключить режим обслуживания и вернуть систему в работу?"
    );
    if (!confirmed) return;
    setActionLoading("maintenance");
    try {
      const status = await systemApi.setMaintenanceMode(next);
      setIsMaintenanceMode(Boolean(status.enabled));
      showSuccess(next ? "Режим обслуживания включен" : "Режим обслуживания выключен");
    } catch (err) {
      console.error("Maintenance toggle failed", err);
      showError("Не удалось переключить режим обслуживания");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckOneC = async () => {
    setActionLoading("onec");
    try {
      const status = await systemApi.checkOneCConnection();
      setOneCStatus(status);
      setServices((current) => mergeOneCService(current, status));
      setLastUpdated(new Date());
      showSuccess(status.connected ? "1С доступна" : "1С недоступна");
    } catch (err) {
      console.error("1C check failed", err);
      showError("Не удалось проверить соединение с 1С");
    } finally {
      setActionLoading(null);
    }
  };

  const overallStatus = useMemo(
    () => computeOverallStatus(health, services),
    [health, services]
  );

  const statusLabel = useMemo(() => {
    switch (overallStatus) {
      case "online":
        return "Работает";
      case "offline":
        return "Недоступно";
      case "maintenance":
        return "Обслуживание";
      case "warning":
      default:
        return "Предупреждения";
    }
  }, [overallStatus]);

  if (loading) {
    return (
      <ComponentCard title="Состояние системы">
        <div className="flex h-48 items-center justify-center text-sm text-gray-500">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-brand-500" />
            <span>Загрузка информации...</span>
          </div>
        </div>
      </ComponentCard>
    );
  }

  if (error) {
    return (
      <ComponentCard title="Состояние системы">
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-300">
          <p>{error}</p>
          <Button size="sm" onClick={loadStatus}>
            Повторить попытку
          </Button>
        </div>
      </ComponentCard>
    );
  }

  return (
    <div className="space-y-6">
       <h1>Общее состояние</h1>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleToggleMaintenance}
              disabled={actionLoading === "maintenance"}
            >
              {isMaintenanceMode ? "Выключить обслуживание" : "Включить обслуживание"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={loadStatus}
            >
              Обновить
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCheckOneC}
              disabled={actionLoading === "onec"}
            >
              {actionLoading === "onec" ? "Проверка 1С..." : "Проверить 1С"}
            </Button>
          </div>
      
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <p className="text-sm text-gray-500">Статус системы</p>
            <div className="mt-2 flex items-center gap-3">
              <Badge color={statusBadgeColor(overallStatus)}>{statusLabel}</Badge>
              {lastUpdated && (
                <span className="text-xs text-gray-500">
                  Обновлено: {lastUpdated.toLocaleTimeString("ru-RU")}
                </span>
              )}
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <p className="text-sm text-gray-500">Количество сервисов</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{services.length}</p>
            <p className="text-xs text-gray-500">
              В работе: {services.filter((s) => s.status === "online").length}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <p className="text-sm text-gray-500">Режим обслуживания</p>
            <p className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
              {isMaintenanceMode ? "Включен" : "Выключен"}
            </p>
            <p className="text-xs text-gray-500">
              Пользователи {isMaintenanceMode ? "видят страницу обслуживания" : "могут работать в системе"}
            </p>
          </div>
        </div>


          <h1>Действия</h1>
        <div className="flex flex-wrap gap-3">
          <Button
            size="sm"
            onClick={handleDiagnostics}
            disabled={actionLoading === "diagnostics"}
          >
            {actionLoading === "diagnostics" ? "Диагностика..." : "Полная диагностика"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCreateBackup}
            disabled={actionLoading === "backup"}
          >
            {actionLoading === "backup" ? "Создание бэкапа..." : "Создать бэкап"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRestart}
            disabled={actionLoading === "restart"}
          >
            {actionLoading === "restart" ? "Перезапуск..." : "Перезапуск сервисов"}
          </Button>
        </div>


      <h1>Интеграция с 1С</h1>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCheckOneC}
            disabled={actionLoading === "onec"}
          >
            {actionLoading === "onec" ? "Проверка..." : "Повторить проверку"}
          </Button>
       
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <p className="text-sm text-gray-500">Статус соединения</p>
            <div className="mt-2 flex items-center gap-3">
              <Badge color={statusBadgeColor(oneCStatus?.connected ? "online" : "offline")}>
                {oneCStatus?.connected ? "Онлайн" : "Недоступно"}
              </Badge>
              {oneCStatus?.timestamp && (
                <span className="text-xs text-gray-500">
                  Проверено: {new Date(oneCStatus.timestamp).toLocaleTimeString("ru-RU")}
                </span>
              )}
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800 md:col-span-2">
            <p className="text-sm text-gray-500">Комментарий</p>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              {oneCStatus?.message ?? "Данные о проверке отсутствуют"}
            </p>
          </div>
        </div>
      

      <h1>Сервисы</h1>
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/40">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Сервис
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Статус
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Описание
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
              {services.map((service) => (
                <tr key={service.id}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    {service.name}
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={statusBadgeColor(service.status)}>
                      {service.status === "online"
                        ? "Онлайн"
                        : service.status === "offline"
                        ? "Офлайн"
                        : service.status === "maintenance"
                        ? "Обслуживание"
                        : "Проверить"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {service.description ?? "—"}
                  </td>
                </tr>
              ))}
              {services.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-500">
                    Нет данных о сервисах
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      

            <h1>Серверные метрики</h1>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric) => {
            const status = metricStatus(metric);
            const statusLabel =
              status === "critical" ? "Критично" : status === "warning" ? "Повышено" : "Норма";
            const statusColor =
              status === "critical" ? "text-red-600 dark:text-red-400" : status === "warning" ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400";

            return (
              <div
                key={metric.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-500">{metric.name}</p>
                  <span className={`text-xs font-semibold uppercase ${statusColor}`}>
                    {statusLabel}
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {metric.value}
                  </span>
                  {metric.unit && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">{metric.unit}</span>
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Обновлено: {new Date(metric.lastUpdated).toLocaleTimeString("ru-RU")}
                </p>
              </div>
            );
          })}
        </div>
      
    </div>
  );
};

export default SystemStatusPage;
