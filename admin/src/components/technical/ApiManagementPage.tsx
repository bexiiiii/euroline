"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Form from "../form/Form";
import Input from "../form/input/InputField";
import TextArea from "../form/input/TextArea";
import { CopyIcon } from "@/icons";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import { apiKeysApi, ApiKeyItem, ApiKeyLogEntry, ApiKeyMetrics } from "@/lib/api/api-keys";
import { useToast } from "@/context/ToastContext";
import { logPageView, logUserAction } from "@/lib/eventLogger";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "keys", name: "API ключи" },
  { id: "docs", name: "Документация" },
  { id: "usage", name: "Примеры" },
] as const;

type TabId = (typeof TABS)[number]["id"];

type CreatedKeyState = {
  id: number;
  apiKey: string;
} | null;

const ApiManagementPage: React.FC = () => {
  const { success: showSuccess, error: showError } = useToast();

  const [activeTab, setActiveTab] = useState<TabId>("keys");
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
      showSuccess("API ключ создан. Скопируйте секрет и храните безопасно.");
      logUserAction(`Создан API ключ: ${result.id}`, newKeyName.trim());
      await Promise.all([loadKeys(), loadMetrics()]);
    } catch (err) {
      console.error("Failed to create API key", err);
      showError("Ошибка при создании ключа");
    } finally {
      setCreatingKey(false);
    }
  };

  const handleCopySecret = async (secret: string) => {
    try {
      await navigator.clipboard.writeText(secret);
      showSuccess("Секрет скопирован в буфер обмена");
    } catch (err) {
      console.error("Failed to copy secret", err);
      showError("Не удалось скопировать секрет. Скопируйте вручную.");
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
      showSuccess("Секрет ключа обновлён. Обновите конфигурацию интеграций.");
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
    <Badge color={key.active ? "success" : "error"} size="sm">
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

  return (
    <div className="space-y-6">
      {activeTab === "keys" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricsCard
              loading={metricsLoading}
              title="Активные ключи"
              value={activeKeys}
              subtitle={`из ${apiKeys.length}`}
              tone="primary"
            />
            <MetricsCard
              loading={metricsLoading}
              title="Запросов сегодня"
              value={metrics?.requestsToday ?? 0}
              subtitle="проверено через API"
              tone="info"
            />
            <MetricsCard
              loading={metricsLoading}
              title="Uptime"
              value={`${(metrics?.uptimePercentage ?? 100).toFixed(2)}%`}
              subtitle={`${metrics?.errorCountToday ?? 0} ошибок сегодня`
              }
              tone="success"
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex flex-wrap gap-4 px-6 py-2" aria-label="Tabs">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors",
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                    )}
                  >
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              <SectionCard
                title="Управление API ключами"
                description="Создание и управление доступом внешних интеграций"
                action={
                  <Button
                    size="sm"
                    onClick={() => {
                      setIsCreateModalOpen(true);
                      setCreatedKey(null);
                      setNameError(null);
                    }}
                  >
                    Создать ключ
                  </Button>
                }
              >
                {loading ? (
                  <div className="flex justify-center items-center py-10 text-gray-500 dark:text-gray-400">
                    Загрузка ключей...
                  </div>
                ) : apiKeys.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <p className="text-lg font-medium">API ключи не найдены</p>
                    <p className="text-sm mt-1">Создайте первый ключ, чтобы предоставить доступ партнёрам</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm dark:border-gray-800">
                    <Table className="min-w-full">
                      <TableHeader>
                        <TableRow>
                          <TableCell isHeader className="px-5 py-3 text-left">Название</TableCell>
                          <TableCell isHeader className="px-5 py-3 text-left">Статус</TableCell>
                          <TableCell isHeader className="px-5 py-3 text-left">Последнее использование</TableCell>
                          <TableCell isHeader className="px-5 py-3 text-left">Запросов</TableCell>
                          <TableCell isHeader className="px-5 py-3 text-left">Действия</TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {apiKeys.map((key) => (
                          <TableRow
                            key={key.id}
                            className={cn(
                              "cursor-pointer",
                              selectedKeyId === key.id ? "bg-blue-50/60 dark:bg-blue-900/30" : "hover:bg-gray-50 dark:hover:bg-gray-800"
                            )}
                            onClick={() => handleSelectKey(key.id)}
                          >
                            <TableCell className="px-5 py-4">
                              <div className="font-medium text-gray-900 dark:text-white">{key.name || `Ключ #${key.id}`}</div>
                              {key.description && (
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{key.description}</div>
                              )}
                              <div className="text-xs text-gray-400 mt-1">
                                Создан: {renderDateTime(key.createdAt)}
                              </div>
                            </TableCell>
                            <TableCell className="px-5 py-4">{renderKeyStatus(key)}</TableCell>
                            <TableCell className="px-5 py-4">
                              <div className="text-sm text-gray-700 dark:text-gray-300">{renderDateTime(key.lastUsedAt)}</div>
                              <div className="text-xs text-gray-400">IP: {key.lastUsedIp || '—'}</div>
                            </TableCell>
                            <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                              {key.requestCount}
                            </TableCell>
                            <TableCell className="px-5 py-4">
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="!px-3 !py-2 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleActive(key);
                                  }}
                                >
                                  {key.active ? "Деактивировать" : "Активировать"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="!px-3 !py-2 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    rotateKey(key);
                                  }}
                                >
                                  Перегенерировать
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="!px-3 !py-2 text-xs text-red-600 hover:text-red-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmRevoke(key);
                                  }}
                                >
                                  Отозвать
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {selectedKey && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                      Последние запросы ключа «{selectedKey.name || selectedKey.id}»
                    </h4>
                    {logsLoading ? (
                      <div className="text-sm text-gray-500 dark:text-gray-400">Загрузка журнала...</div>
                    ) : logs.length === 0 ? (
                      <div className="text-sm text-gray-500 dark:text-gray-400">Запросов пока не было.</div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm dark:border-gray-800">
                        <Table className="min-w-full">
                          <TableHeader>
                            <TableRow>
                              <TableCell isHeader className="px-4 py-2 text-left">Время</TableCell>
                              <TableCell isHeader className="px-4 py-2 text-left">Маршрут</TableCell>
                              <TableCell isHeader className="px-4 py-2 text-left">Метод</TableCell>
                              <TableCell isHeader className="px-4 py-2 text-left">Статус</TableCell>
                              <TableCell isHeader className="px-4 py-2 text-left">IP</TableCell>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {logs.map((log) => (
                              <TableRow key={log.id}>
                                <TableCell className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                                  {renderDateTime(log.requestedAt)}
                                </TableCell>
                                <TableCell className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 font-mono">
                                  {log.requestPath || '—'}
                                </TableCell>
                                <TableCell className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                                  {log.requestMethod || '—'}
                                </TableCell>
                                <TableCell className="px-4 py-2 text-sm">
                                  <Badge color={(log.responseStatus ?? 0) >= 500 ? "error" : "info"} size="sm">
                                    {log.responseStatus ?? '—'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                                  {log.clientIp || '—'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )}
              </SectionCard>
            </div>
          </div>
        </>
      )}

      {activeTab === "docs" && (
        <SectionCard
          title="Документация"
          description="Рекомендации по использованию API для внешних партнёров"
        >
          <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300">
            <section>
              <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Аутентификация</h4>
              <p>
                Каждый запрос к внешнему API должен содержать заголовок <code className="font-mono">X-API-Key</code> с вашим активным секретом. Ключи следует хранить в защищённых секрет-хранилищах и перегенерировать при компрометации.
              </p>
            </section>

            <section>
              <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Базовые эндпоинты</h4>
              <ul className="list-disc list-inside space-y-2">
                <li><code className="font-mono">GET /api/external/products</code> — список товаров</li>
                <li><code className="font-mono">{`GET /api/external/products/{id}`}</code> — карточка товара</li>
                <li><code className="font-mono">POST /api/external/orders</code> — создание заказа</li>
                <li><code className="font-mono">{`GET /api/external/orders/{id}/status`}</code> — статус заказа</li>
              </ul>
            </section>

            <section>
              <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Коды ответов</h4>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>200</strong> — успешный запрос</li>
                <li><strong>401</strong> — ключ отсутствует или недействителен</li>
                <li><strong>429</strong> — превышен лимит запросов</li>
                <li><strong>500</strong> — внутреняя ошибка сервера</li>
              </ul>
            </section>
          </div>
        </SectionCard>
      )}

      {activeTab === "usage" && (
        <SectionCard
          title="Примеры интеграции"
          description="Шаблоны запросов на популярных языках"
        >
          <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300">
            <section>
              <h4 className="text-base font-semibold mb-3">JavaScript (fetch)</h4>
              <pre className="bg-gray-900 text-white rounded-lg p-4 text-xs overflow-x-auto">
{`const response = await fetch('https://api.autoparts.kz/api/external/products', {
  headers: {
    'X-API-Key': process.env.EXTERNAL_API_KEY,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();`}
              </pre>
            </section>
            <section>
              <h4 className="text-base font-semibold mb-3">Python (requests)</h4>
              <pre className="bg-gray-900 text-white rounded-lg p-4 text-xs overflow-x-auto">
{`import requests

headers = {
  'X-API-Key': API_KEY,
  'Content-Type': 'application/json'
}

response = requests.post(
  'https://api.autoparts.kz/api/external/orders',
  headers=headers,
  json={'orderId': '12345'}
)
response.raise_for_status()
print(response.json())`}
              </pre>
            </section>
          </div>
        </SectionCard>
      )}

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreatedKey(null);
          setNameError(null);
        }}
        size="md"
        className="p-0"
      >
        <div className="space-y-6 p-6 sm:p-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Создание API ключа
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Укажите название для идентификации ключа и при необходимости добавьте описание.
            </p>
          </div>

          {!createdKey ? (
            <Form
              onSubmit={(_event) => {
                handleCreateKey();
              }}
              className="space-y-5"
            >
              <div className="space-y-1.5">
                <Label htmlFor="api-key-name">Название</Label>
                <Input
                  id="api-key-name"
                  placeholder="Например, CRM интеграция"
                  value={newKeyName}
                  onChange={(event) => {
                    setNewKeyName(event.target.value);
                    if (nameError) {
                      setNameError(null);
                    }
                  }}
                  error={Boolean(nameError)}
                  hint={nameError ?? "Название поможет вам отличать ключи между собой"}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="api-key-description">Описание</Label>
                <TextArea
                  rows={3}
                  id="api-key-description"
                  placeholder="Дополнительная информация для команды"
                  value={newKeyDescription}
                  onChange={(value) => setNewKeyDescription(value)}
                  hint="Необязательное поле"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setNameError(null);
                  }}
                >
                  Отмена
                </Button>
                <Button type="submit" disabled={creatingKey}>
                  {creatingKey ? "Создание..." : "Создать"}
                </Button>
              </div>
            </Form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-100">
                Скопируйте секрет ниже — он будет показан только один раз.
              </div>
              <div className="relative rounded-lg border border-gray-200 bg-gray-50 p-4 pr-12 font-mono text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
                {createdKey.apiKey}
                <button
                  type="button"
                  onClick={() => handleCopySecret(createdKey.apiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white/80 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-300 dark:hover:bg-gray-800"
                  aria-label="Скопировать секрет ключа"
                >
                  <CopyIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setCreatedKey(null);
                    setNameError(null);
                  }}
                >
                  Готово
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={confirmRevoke !== null}
        onClose={() => setConfirmRevoke(null)}
        size="sm"
        className="p-0"
      >
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Отзыв API ключа</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Ключ «{confirmRevoke?.name || confirmRevoke?.id}» будет немедленно деактивирован. Все интеграции, использующие этот ключ, потеряют доступ.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setConfirmRevoke(null)}>
              Отмена
            </Button>
            <Button
              variant="primary"
              className="!bg-red-600 hover:!bg-red-700"
              onClick={revokeKey}
            >
              Отозвать
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

interface MetricsCardProps {
  loading: boolean;
  title: string;
  value: number | string;
  subtitle?: string;
  tone?: "primary" | "info" | "success";
}

interface SectionCardProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, description, action, children }) => (
  <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
    <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 dark:border-gray-800 md:flex-row md:items-center md:justify-between">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {description && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
    <div className="px-6 py-5">{children}</div>
  </div>
);

const toneClasses: Record<NonNullable<MetricsCardProps["tone"]>, string> = {
  primary: "text-blue-600 dark:text-blue-300",
  info: "text-indigo-600 dark:text-indigo-300",
  success: "text-emerald-600 dark:text-emerald-300",
};

const MetricsCard: React.FC<MetricsCardProps> = ({ loading, title, value, subtitle, tone = "primary" }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
    <div className="mt-2 flex items-baseline">
      <p className={cn("text-3xl font-bold", toneClasses[tone])}>
        {loading ? "—" : value}
      </p>
    </div>
    {subtitle && (
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
    )}
  </div>
);

export default ApiManagementPage;
