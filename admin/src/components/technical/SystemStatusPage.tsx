"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import StatCard, { StatGrid } from "@/components/common/StatCard";
import {
  ClockIcon,
  DiskIcon,
  RefreshIcon,
  ServerIcon,
  toolbarIconButtonClass,
} from "@/components/analytics/StatIcons";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { systemApi, ActuatorComponent, ActuatorHealth, DiagnosticsResult, OneCStatus } from "@/lib/api/system";
import { useToast } from "@/context/ToastContext";

type ServiceState = "online" | "offline" | "warning" | "maintenance";

interface SystemService {
  id: string;
  name: string;
  status: ServiceState;
  description?: string;
  details?: Record<string, unknown>;
}

const SERVICE_LABELS: Record<string, string> = {
  db: "База данных",
  database: "База данных",
  redis: "Кэш",
  diskSpace: "Диск",
  mail: "Почта",
  ssl: "SSL-сертификаты",
};

/** Служебные проверки, которые не нужны оператору в списке (но учитываются в общем статусе). */
const HIDDEN_SERVICES = new Set(["ping", "livenessState", "readinessState", "discoveryComposite", "refreshScope"]);

const SERVICE_STATUS_LABELS: Record<ServiceState, string> = {
  online: "Работает",
  offline: "Недоступен",
  maintenance: "Обслуживание",
  warning: "Проверить",
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

const formatGb = (bytes: number) =>
  `${(bytes / 1024 ** 3).toLocaleString("ru-RU", { maximumFractionDigits: 1 })} ГБ`;

// Spring Actuator diskSpace: total/free/threshold в байтах.
const extractDisk = (health: ActuatorHealth | null) => {
  const details = health?.components?.diskSpace?.details;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  return {
    free: num(details?.free),
    total: num(details?.total),
    threshold: num(details?.threshold),
  };
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

const SystemStatusPage: React.FC = () => {
  const { success: showSuccess, error: showError } = useToast();
  const [health, setHealth] = useState<ActuatorHealth | null>(null);
  const [services, setServices] = useState<SystemService[]>([]);
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
        name: "1С",
        status: status.connected ? "online" : "offline",
        description: status.message ?? undefined,
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
      const [statusHealth, maintenance, onec] = await Promise.all([
        systemApi.getSystemStatus(),
        systemApi.getMaintenanceStatus(),
        systemApi.checkOneCConnection().catch(() => null),
      ]);
      const serviceList = normalizeComponents(statusHealth.components);
      setHealth(statusHealth);
      setOneCStatus(onec);
      setServices(mergeOneCService(serviceList, onec));
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
      setServices(mergeOneCService(normalizeComponents(result.health.components), oneCStatus));
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
      showSuccess("Резервное копирование запущено");
    } catch (err) {
      console.error("Backup failed", err);
      showError("Не удалось создать резервную копию");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestart = async () => {
    if (!confirm("Перезапустить приложение? Сайт будет недоступен на время перезапуска.")) {
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
        : "Выключить режим обслуживания?"
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

  const disk = useMemo(() => extractDisk(health), [health]);
  const visibleServices = useMemo(
    () => services.filter((service) => !HIDDEN_SERVICES.has(service.id)),
    [services]
  );

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
        return "Есть проблемы";
    }
  }, [overallStatus]);

  if (loading) {
    return <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">Загрузка...</div>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-center dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-sm text-error-600 dark:text-error-400">Не удалось загрузить данные</p>
        <Button size="xs" variant="outline" className="mt-3" onClick={loadStatus}>
          Повторить
        </Button>
      </div>
    );
  }

  const toneFor = (status: ServiceState) =>
    status === "online" ? "success" : status === "offline" ? "error" : "warning";

  const diskTone =
    health?.components?.diskSpace?.status === "DOWN"
      ? "error"
      : disk.free != null && disk.threshold != null && disk.free < disk.threshold * 2
      ? "warning"
      : "default";

  return (
    <div className="space-y-4">
      <StatGrid>
        <StatCard
          label="Система"
          value={statusLabel}
          icon={<ServerIcon />}
          tone={toneFor(overallStatus)}
          hint={lastUpdated ? `Обновлено ${lastUpdated.toLocaleTimeString("ru-RU")}` : undefined}
        />
        <StatCard
          label="1С"
          value={oneCStatus == null ? "—" : oneCStatus.connected ? "Подключена" : "Нет связи"}
          icon={<RefreshIcon />}
          tone={oneCStatus == null ? "default" : oneCStatus.connected ? "success" : "error"}
          hint={
            oneCStatus?.timestamp
              ? `Проверено ${new Date(oneCStatus.timestamp).toLocaleTimeString("ru-RU")}`
              : undefined
          }
        />
        <StatCard
          label="Свободно на диске"
          value={disk.free != null ? formatGb(disk.free) : "—"}
          icon={<DiskIcon />}
          tone={diskTone}
          hint={disk.total != null ? `из ${formatGb(disk.total)}` : undefined}
        />
        <StatCard
          label="Режим обслуживания"
          value={isMaintenanceMode ? "Включен" : "Выключен"}
          icon={<ClockIcon />}
          tone={isMaintenanceMode ? "warning" : "default"}
        />
      </StatGrid>

      {oneCStatus && !oneCStatus.connected && oneCStatus.message && (
        <p className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700 dark:bg-error-500/15 dark:text-error-400">
          {/^1С/.test(oneCStatus.message) ? oneCStatus.message : `1С: ${oneCStatus.message}`}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={loadStatus}
          className={toolbarIconButtonClass}
          aria-label="Обновить"
          title="Обновить"
        >
          <RefreshIcon />
        </button>
        <Button
          size="sm"
          variant="outline"
          className="h-10! py-0!"
          onClick={handleCheckOneC}
          disabled={actionLoading === "onec"}
        >
          {actionLoading === "onec" ? "Проверка..." : "Проверить 1С"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-10! py-0!"
          onClick={handleDiagnostics}
          disabled={actionLoading === "diagnostics"}
        >
          {actionLoading === "diagnostics" ? "Диагностика..." : "Диагностика"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-10! py-0!"
          onClick={handleCreateBackup}
          disabled={actionLoading === "backup"}
        >
          {actionLoading === "backup" ? "Запуск..." : "Резервная копия"}
        </Button>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-10! py-0!"
            onClick={handleToggleMaintenance}
            disabled={actionLoading === "maintenance"}
          >
            {isMaintenanceMode ? "Выключить обслуживание" : "Включить обслуживание"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-10! py-0! text-error-600! dark:text-error-400!"
            onClick={handleRestart}
            disabled={actionLoading === "restart"}
          >
            {actionLoading === "restart" ? "Перезапуск..." : "Перезапустить"}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="border-b border-gray-100 p-4 text-base font-semibold text-gray-800 dark:border-gray-800 dark:text-white/90">
          Сервисы
        </h3>
        {visibleServices.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Нет данных</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {visibleServices.map((service) => (
              <li key={service.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-sm font-medium text-gray-800 dark:text-white/90">{service.name}</span>
                <Badge variant="light" size="sm" color={statusBadgeColor(service.status)}>
                  {SERVICE_STATUS_LABELS[service.status]}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SystemStatusPage;
