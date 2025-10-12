"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import CustomerSelector from "./CustomerSelector";
import TextArea from "@/components/form/input/TextArea";
import Input from "@/components/form/input/InputField";
import Badge from "@/components/ui/badge/Badge";
import { TopUpResponse } from "@/lib/api/finance";
import { API_URL } from "@/lib/api";

interface SelectedCustomer {
  id: number;
  name: string;
  email: string;
  phone: string;
  balance: number;
  registrationDate: string;
}

interface CreatePayload {
  clientId: number;
  amount: number;
  paymentMethod?: string;
  adminComment?: string;
}

interface UpdatePayload {
  id: number;
  status?: string;
  paymentMethod?: string;
  adminComment?: string;
}

interface TopUpBalanceModalProps {
  isOpen: boolean;
  mode: "view" | "create";
  topUp: TopUpResponse | null;
  onClose: () => void;
  onCreate: (payload: CreatePayload) => Promise<void> | void;
  onUpdate: (payload: UpdatePayload) => Promise<void> | void;
}

const paymentMethods = [
  "Банковская карта",
  "Банковский перевод",
  "Наличные",
  "Электронный кошелек",
  "Другое",
];

const statusOptions = [
  { value: "PENDING", label: "Ожидает" },
  { value: "APPROVED", label: "Одобрен" },
  { value: "REJECTED", label: "Отклонён" },
];

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("kk-KZ", {
    style: "currency",
    currency: "KZT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const statusBadge: Record<string, { color: React.ComponentProps<typeof Badge>["color"]; label: string }> = {
  PENDING: { color: "warning", label: "Ожидает" },
  APPROVED: { color: "success", label: "Одобрен" },
  REJECTED: { color: "error", label: "Отклонён" },
};

const TopUpBalanceModal: React.FC<TopUpBalanceModalProps> = ({
  isOpen,
  mode,
  topUp,
  onClose,
  onCreate,
  onUpdate,
}) => {
  const isCreate = mode === "create";

  const [selectedCustomer, setSelectedCustomer] = useState<SelectedCustomer | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>(paymentMethods[0]);
  const [status, setStatus] = useState<string>("PENDING");
  const [adminComment, setAdminComment] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setErrors({});
      setServerError(null);
      setSelectedCustomer(null);
      setAmount("");
      setPaymentMethod(paymentMethods[0]);
      setStatus("PENDING");
      setAdminComment("");
      setLoading(false);
      return;
    }

    if (isCreate) {
      setSelectedCustomer(null);
      setAmount("");
      setPaymentMethod(paymentMethods[0]);
      setStatus("PENDING");
      setAdminComment("");
    } else if (topUp) {
      setPaymentMethod(topUp.paymentMethod || paymentMethods[0]);
      setStatus(topUp.status || "PENDING");
      setAdminComment(topUp.adminComment || "");
    }
    setErrors({});
    setServerError(null);
  }, [isOpen, isCreate, topUp]);

  const statusInfo = useMemo(() => {
    if (!topUp?.status) return null;
    return statusBadge[topUp.status] ?? { color: "light" as const, label: topUp.status };
  }, [topUp?.status]);

  const receiptUrlCandidates = useMemo(
    () => buildReceiptUrlCandidates(topUp?.receiptUrl),
    [topUp?.receiptUrl]
  );

  const receiptOriginalUrl = receiptUrlCandidates[0] ?? null;

  const receiptLinkHref = receiptOriginalUrl;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setServerError(null);

    if (isCreate) {
      const validation: { [key: string]: string } = {};
      if (!selectedCustomer) {
        validation.customer = "Выберите клиента";
      }
      const amountValue = Number(amount);
      if (!amount.trim() || Number.isNaN(amountValue) || amountValue <= 0) {
        validation.amount = "Введите сумму больше 0";
      }
      if (Object.keys(validation).length > 0) {
        setErrors(validation);
        return;
      }

      setLoading(true);
      try {
        await onCreate({
          clientId: selectedCustomer!.id,
          amount: amountValue,
          paymentMethod,
          adminComment: adminComment.trim() ? adminComment.trim() : undefined,
        });
        onClose();
      } catch (error) {
        console.error("Ошибка создания пополнения", error);
        setServerError(error instanceof Error ? error.message : "Не удалось создать пополнение");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!topUp) return;

    setLoading(true);
    try {
      await onUpdate({
        id: topUp.id,
        status,
        paymentMethod,
        adminComment: adminComment.trim(),
      });
      onClose();
    } catch (error) {
      console.error("Ошибка обновления пополнения", error);
      setServerError(error instanceof Error ? error.message : "Не удалось обновить заявку");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isCreate ? "Создать пополнение баланса" : `Заявка на пополнение #${topUp?.id}`}
            </h2>
            {!isCreate && topUp && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Создана {formatDateTime(topUp.createdAt)}
              </p>
            )}
          </div>
          {!isCreate && statusInfo && (
            <Badge color={statusInfo.color}>{statusInfo.label}</Badge>
          )}
        </div>

        {serverError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-200">
            {serverError}
          </div>
        )}

        {isCreate ? (
          <div className="space-y-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-900/40 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Выбор клиента
              </h3>
              <CustomerSelector
                selectedCustomer={selectedCustomer}
                onSelectCustomer={(customer) => {
                  setSelectedCustomer(customer);
                  if (errors.customer) {
                    setErrors((prev) => ({ ...prev, customer: "" }));
                  }
                }}
                placeholder="Выберите клиента для пополнения"
              />
              {errors.customer && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.customer}</p>
              )}

              {selectedCustomer && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <div>
                    <span className="font-medium text-gray-800 dark:text-gray-100">Имя:</span>
                    <span className="ml-2">{selectedCustomer.name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-800 dark:text-gray-100">Email:</span>
                    <span className="ml-2">{selectedCustomer.email}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-800 dark:text-gray-100">Телефон:</span>
                    <span className="ml-2">{selectedCustomer.phone || "—"}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-800 dark:text-gray-100">Текущий баланс:</span>
                    <span className="ml-2">{formatAmount(selectedCustomer.balance)}</span>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Сумма пополнения *
                </label>
                <Input
                  type="number"
                  min="1"
                  step={1}
                  value={amount}
                  onChange={(event) => {
                    setAmount(event.target.value);
                    if (errors.amount) {
                      setErrors((prev) => ({ ...prev, amount: "" }));
                    }
                  }}
                  placeholder="0"
                  className={errors.amount ? "border-red-300 dark:border-red-600" : ""}
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Валюта: тенге (₸)</p>
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.amount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Способ оплаты
                </label>
                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Комментарий администратора
                </label>
                <TextArea
                  value={adminComment}
                  onChange={setAdminComment}
                  rows={4}
                  placeholder="Примечания к заявке"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Отменить
                </button>
                <Button variant="primary" size="sm" disabled={loading}>
                  {loading ? "Сохраняем…" : "Создать"}
                </Button>
              </div>
            </form>
          </div>
        ) : topUp ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900/40 rounded-lg">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Имя</p>
                <p className="text-sm text-gray-900 dark:text-white">{topUp.clientName || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</p>
                <p className="text-sm text-gray-900 dark:text-white">{topUp.clientEmail || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Телефон</p>
                <p className="text-sm text-gray-900 dark:text-white">{topUp.clientPhone || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Дата запроса</p>
                <p className="text-sm text-gray-900 dark:text-white">{formatDateTime(topUp.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Сумма</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatAmount(topUp.amount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Способ пополнения</p>
                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                  {!paymentMethods.includes(paymentMethod) && (
                    <option value={paymentMethod}>{paymentMethod}</option>
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Статус заявки
                </label>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Чек пополнения</p>
                {topUp.receiptUrl ? (
                  <div className="space-y-3">
                    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                      <ReceiptPreview
                        candidates={receiptUrlCandidates}
                        alt="Квитанция"
                      />
                    </div>
                    {receiptLinkHref ? (
                      <a
                        href={receiptLinkHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        Открыть оригинал
                      </a>
                    ) : (
                      <span className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400">
                        Ссылка на оригинал недоступна
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-500 dark:text-gray-400">
                    Чек не прикреплён
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Комментарий администратора
              </label>
              <TextArea
                value={adminComment}
                onChange={setAdminComment}
                rows={4}
                placeholder="Добавьте примечание для истории"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Закрыть
              </button>
              <Button type="submit" variant="primary" size="sm" disabled={loading}>
                {loading ? "Сохраняем…" : "Сохранить изменения"}
              </Button>
            </div>
          </form>
        ) : null}
      </div>
    </Modal>
  );
};

interface ReceiptPreviewProps {
  candidates: string[];
  alt?: string;
}

const receiptFallback = (
  <div className="flex h-64 w-full items-center justify-center bg-gray-100 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
    Изображение недоступно
  </div>
);

const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({ candidates, alt = "" }) => {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setIndex(0);
    setFailed(false);
  }, [candidates]);

  const currentSrc = candidates[index];

  if (!currentSrc || failed) {
    return receiptFallback;
  }

  const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const nextIndex = index + 1;
    if (nextIndex < candidates.length) {
      setIndex(nextIndex);
    } else {
      setFailed(true);
      console.error("Ошибка загрузки изображения:", event.currentTarget.src);
    }
  };

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={currentSrc}
      alt={alt}
      className="h-64 w-full bg-gray-100 object-contain dark:bg-gray-800"
      onError={handleError}
    />
  );
};

function buildReceiptUrlCandidates(rawUrl?: string | null): string[] {
  if (!rawUrl) return [];

  const variants = new Set<string>();
  const absolute = toAbsoluteReceiptUrl(rawUrl);
  variants.add(absolute);

  try {
    const url = new URL(absolute);
    const search = url.search || "";
    const segments = url.pathname.split("/").filter(Boolean);

    if (segments.length === 0) {
      return Array.from(variants);
    }

    const lastSegment = segments[segments.length - 1];
    const basePath = segments.length > 1 ? `${url.origin}/${segments.slice(0, -1).join("/")}/` : `${url.origin}/`;

    const addVariant = (filename: string) => {
      if (!filename) return;
      const normalized = encodeURI(`${basePath}${filename}${search}`);
      variants.add(normalized);
    };

    addVariant(lastSegment);

    const decoded = safeDecode(lastSegment);
    addVariant(decoded);

    const spaceReplaced = decoded.replace(/\s+/g, "_");
    addVariant(spaceReplaced);

    const sanitized = decoded.replace(/[^a-zA-Z0-9._-]/g, "_");
    addVariant(sanitized);

    const collapsed = sanitized.replace(/_+/g, "_");
    addVariant(collapsed);

    const encoded = encodeURIComponent(decoded);
    addVariant(encoded);

    return Array.from(variants);
  } catch (error) {
    console.error("Не удалось обработать URL квитанции", rawUrl, error);
    return [absolute];
  }
}

function toAbsoluteReceiptUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  const relative = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${API_URL}${relative}`;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default TopUpBalanceModal;
