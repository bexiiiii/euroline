"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Form from "../form/Form";
import Input from "../form/input/InputField";
import TextArea from "../form/input/TextArea";
import StatCard, { StatGrid } from "../common/StatCard";
import {
  AlertIcon,
  ChartIcon,
  CheckCircleIcon,
  CopyIcon,
  KeyIcon,
  PlusIcon,
  PowerIcon,
  RefreshIcon,
  TrashIcon,
  iconButtonClass,
  iconButtonDangerClass,
} from "../analytics/StatIcons";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import { apiKeysApi, ApiKeyItem, ApiKeyLogEntry, ApiKeyMetrics } from "@/lib/api/api-keys";
import { useToast } from "@/context/ToastContext";
import { logPageView, logUserAction } from "@/lib/eventLogger";
import { cn } from "@/lib/utils";

type CreatedKeyState = {
  id: number;
  apiKey: string;
} | null;

const ApiManagementPage: React.FC = () => {
  const { success: showSuccess, error: showError } = useToast();

  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [metrics, setMetrics] = useState<ApiKeyMetrics | null>(null);
  const [logs, setLogs] = useState<ApiKeyLogEntry[]>([]);
  const [selectedKeyId, setSelectedKeyId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyDescription, setNewKeyDescription] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [creatingKey, setCreatingKey] = useState(false);
  const [createdKey, setCreatedKey] = useState<CreatedKeyState>(null);

  const [confirmRevoke, setConfirmRevoke] = useState<ApiKeyItem | null>(null);

  const loadKeys = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiKeysApi.list();
      setApiKeys(data);
    } catch (err) {
      console.error("Failed to load API keys", err);
      showError("Не удалось загрузить список ключей");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const loadMetrics = useCallback(async () => {
    try {
      setMetricsLoading(true);
      const stats = await apiKeysApi.metrics();
      setMetrics(stats);
    } catch (err) {
      console.error("Failed to load metrics", err);
      showError("Не удалось загрузить статистику по API");
    } finally {
      setMetricsLoading(false);
    }
  }, [showError]);

  const loadLogs = useCallback(async (keyId: number) => {
    try {
      setLogsLoading(true);
      const entries = await apiKeysApi.logs(keyId);
      setLogs(entries);
    } catch (err) {
      console.error("Failed to load logs", err);
      showError("Не удалось загрузить журнал запросов");
    } finally {
      setLogsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadKeys();
    loadMetrics();
    logPageView("Управление API", "/api-management");
  }, [loadKeys, loadMetrics]);

  useEffect(() => {
    if (selectedKeyId !== null) {
      loadLogs(selectedKeyId);
    }
  }, [loadLogs, selectedKeyId]);

  const handleCreateKey = async () => {
    const trimmedName = newKeyName.trim();

    if (!trimmedName) {
      setNameError("Введите название ключа");
      return;
    }

    try {
      setCreatingKey(true);
      const result = await apiKeysApi.create({
        name: trimmedName,
        description: newKeyDescription.trim() || undefined,
      });

      setCreatedKey(result);
      setNewKeyName("");
      setNewKeyDescription("");
      setNameError(null);
      showSuccess("Ключ создан");
      logUserAction(`Создан API ключ: ${result.id}`, newKeyName.trim());
      await Promise.all([loadKeys(), loadMetrics()]);
    } catch (err) {
      console.error("Failed to create API key", err);
      showError("Не удалось создать ключ");
    } finally {
      setCreatingKey(false);
    }
  };

  const handleCopySecret = async (secret: string) => {
    try {
      await navigator.clipboard.writeText(secret);
      showSuccess("Скопировано");
    } catch (err) {
      console.error("Failed to copy secret", err);
      showError("Не удалось скопировать");
    }
  };

  const toggleActive = async (key: ApiKeyItem) => {
    try {
      const updated = await apiKeysApi.update(key.id, { active: !key.active });
      showSuccess(updated.active ? "Ключ активирован" : "Ключ деактивирован");
      setApiKeys(prev => prev.map(k => (k.id === updated.id ? updated : k)));
      await loadMetrics();
    } catch (err) {
      console.error("Failed to toggle API key", err);
      showError("Не удалось изменить статус ключа");
    }
  };

  const rotateKey = async (key: ApiKeyItem) => {
    try {
      const result = await apiKeysApi.rotate(key.id);
      setCreatedKey(result);
      setIsCreateModalOpen(true);
      showSuccess("Секрет обновлён");
      await loadKeys();
    } catch (err) {
      console.error("Failed to rotate API key", err);
      showError("Не удалось перегенерировать ключ");
    }
  };

  const revokeKey = async () => {
    if (!confirmRevoke) return;
    try {
      await apiKeysApi.revoke(confirmRevoke.id);
      showSuccess("Ключ отозван");
      setConfirmRevoke(null);
      await Promise.all([loadKeys(), loadMetrics()]);
    } catch (err) {
      console.error("Failed to revoke API key", err);
      showError("Не удалось отозвать ключ");
    }
  };

  const activeKeys = useMemo(() => apiKeys.filter(k => k.active).length, [apiKeys]);

  const renderKeyStatus = (key: ApiKeyItem) => (
    <Badge variant="light" color={key.active ? "success" : "light"} size="sm">
      {key.active ? "Активен" : "Неактивен"}
    </Badge>
  );

  const renderDateTime = (value?: string | null) => {
    if (!value) return "—";
    return new Date(value).toLocaleString('ru-RU');
  };

  const handleSelectKey = (keyId: number) => {
    setSelectedKeyId(prev => (prev === keyId ? null : keyId));
  };

  const selectedKey = selectedKeyId != null ? apiKeys.find(k => k.id === selectedKeyId) : null;

  const closeKeyModal = () => {
    setIsCreateModalOpen(false);
    setCreatedKey(null);
    setNameError(null);
  };

  return (
    <div className="space-y-4">
      <StatGrid>
        <StatCard
          label="Активные ключи"
          value={loading ? "—" : activeKeys}
          hint={loading ? undefined : `из ${apiKeys.length}`}
          icon={<KeyIcon />}
        />
        <StatCard
          label="Запросов сегодня"
          value={metricsLoading ? "—" : (metrics?.requestsToday ?? "—")}
          icon={<ChartIcon />}
        />
        <StatCard
          label="Ошибок сегодня"
          value={metricsLoading ? "—" : (metrics?.errorCountToday ?? "—")}
          icon={<AlertIcon />}
          tone={(metrics?.errorCountToday ?? 0) > 0 ? "error" : "default"}
        />
        <StatCard
          label="Доступность"
          value={
            metricsLoading || metrics?.uptimePercentage == null
              ? "—"
              : `${metrics.uptimePercentage.toFixed(2)}%`
          }
          icon={<CheckCircleIcon />}
        />
      </StatGrid>

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 p-4 dark:border-gray-800">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">API ключи</h3>
          <Button
            size="sm"
            className="h-10! py-0!"
            startIcon={<PlusIcon className="size-4" />}
            onClick={() => {
              setIsCreateModalOpen(true);
              setCreatedKey(null);
              setNameError(null);
            }}
          >
            Создать ключ
          </Button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Загрузка...</div>
        ) : apiKeys.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Ключей пока нет</div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[720px]">
              <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                <TableRow>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Название</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Статус</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Последний запрос</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Запросов</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    <span className="sr-only">Действия</span>
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {apiKeys.map((key) => (
                  <TableRow
                    key={key.id}
                    className={cn(
                      "cursor-pointer",
                      selectedKeyId === key.id
                        ? "bg-gray-50 dark:bg-white/[0.04]"
                        : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                    )}
                    onClick={() => handleSelectKey(key.id)}
                  >
                    <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      <div className="font-medium text-gray-800 dark:text-white/90">{key.name || `Ключ #${key.id}`}</div>
                      {key.description && (
                        <div className="max-w-xs truncate text-xs text-gray-500 dark:text-gray-400">{key.description}</div>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{renderKeyStatus(key)}</TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{renderDateTime(key.lastUsedAt)}</TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 tabular-nums">{key.requestCount}</TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          className={iconButtonClass}
                          aria-label={key.active ? "Деактивировать" : "Активировать"}
                          title={key.active ? "Деактивировать" : "Активировать"}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleActive(key);
                          }}
                        >
                          <PowerIcon />
                        </button>
                        <button
                          type="button"
                          className={iconButtonClass}
                          aria-label="Перегенерировать секрет"
                          title="Перегенерировать секрет"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("Перегенерировать секрет? Старый секрет перестанет работать.")) {
                              rotateKey(key);
                            }
                          }}
                        >
                          <RefreshIcon />
                        </button>
                        <button
                          type="button"
                          className={iconButtonDangerClass}
                          aria-label="Отозвать"
                          title="Отозвать"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmRevoke(key);
                          }}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {selectedKey && (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="border-b border-gray-100 p-4 text-base font-semibold text-gray-800 dark:border-gray-800 dark:text-white/90">
            Запросы: {selectedKey.name || `Ключ #${selectedKey.id}`}
          </h3>
          {logsLoading ? (
            <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Загрузка...</div>
          ) : logs.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Запросов пока нет</div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[640px]">
                <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                  <TableRow>
                    <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Время</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Запрос</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Ответ</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">IP</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap tabular-nums">{renderDateTime(log.requestedAt)}</TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 font-mono text-xs">
                        {[log.requestMethod, log.requestPath].filter(Boolean).join(" ") || "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        <Badge
                          variant="light"
                          color={(log.responseStatus ?? 0) >= 400 ? "error" : "success"}
                          size="sm"
                        >
                          {log.responseStatus ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 tabular-nums">{log.clientIp || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={isCreateModalOpen} onClose={closeKeyModal} size="md" className="p-0">
        <div className="space-y-4 p-5">
          <h3 className="pr-8 text-base font-semibold text-gray-800 dark:text-white/90">
            {createdKey ? "Секрет ключа" : "Новый API ключ"}
          </h3>

          {!createdKey ? (
            <Form
              onSubmit={(_event) => {
                handleCreateKey();
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="api-key-name">Название</Label>
                <Input
                  id="api-key-name"
                  placeholder="Например, CRM"
                  value={newKeyName}
                  onChange={(event) => {
                    setNewKeyName(event.target.value);
                    if (nameError) {
                      setNameError(null);
                    }
                  }}
                  error={Boolean(nameError)}
                  hint={nameError ?? undefined}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="api-key-description">Описание</Label>
                <TextArea
                  rows={3}
                  id="api-key-description"
                  placeholder="Необязательно"
                  value={newKeyDescription}
                  onChange={(value) => setNewKeyDescription(value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" type="button" variant="outline" onClick={closeKeyModal}>
                  Отмена
                </Button>
                <Button size="sm" type="submit" disabled={creatingKey}>
                  {creatingKey ? "Создание..." : "Создать"}
                </Button>
              </div>
            </Form>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Секрет показывается один раз. Скопируйте его сейчас.
              </p>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2 pl-3 dark:border-gray-800 dark:bg-white/[0.03]">
                <code className="min-w-0 flex-1 break-all font-mono text-sm text-gray-800 dark:text-white/90">
                  {createdKey.apiKey}
                </code>
                <button
                  type="button"
                  onClick={() => handleCopySecret(createdKey.apiKey)}
                  className={iconButtonClass}
                  aria-label="Скопировать"
                  title="Скопировать"
                >
                  <CopyIcon />
                </button>
              </div>
              <div className="flex justify-end">
                <Button size="sm" onClick={closeKeyModal}>
                  Готово
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal isOpen={confirmRevoke !== null} onClose={() => setConfirmRevoke(null)} size="sm" className="p-0">
        <div className="space-y-4 p-5">
          <h3 className="pr-8 text-base font-semibold text-gray-800 dark:text-white/90">Отозвать ключ?</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ключ «{confirmRevoke?.name || confirmRevoke?.id}» перестанет работать сразу.
          </p>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setConfirmRevoke(null)}>
              Отмена
            </Button>
            <Button size="sm" className="bg-error-500! hover:bg-error-600!" onClick={revokeKey}>
              Отозвать
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ApiManagementPage;
