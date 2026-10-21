"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import CustomerSelector from "./CustomerSelector";
import Badge from "@/components/ui/badge/Badge";
import { TopUpResponse } from "@/lib/api/finance";
import { API_URL } from "@/lib/api";
import { formatDateTime, formatKzt } from "@/lib/format";
import { controlClass, fieldLabelClass } from "./tableUi";

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

  const methodOptions = (
    <>
      {paymentMethods.map((method) => (
        <option key={method} value={method}>
          {method}
        </option>
      ))}
      {!paymentMethods.includes(paymentMethod) && <option value={paymentMethod}>{paymentMethod}</option>}
    </>
  );

  const footer = (submitLabel: string, cancelLabel: string) => (
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" size="sm" onClick={onClose}>
        {cancelLabel}
      </Button>
      <Button type="submit" variant="primary" size="sm" disabled={loading}>
        {loading ? "Сохранение…" : submitLabel}
      </Button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" className="p-0">
      <div className="space-y-4 p-5">
        <div className="pr-12">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
              {isCreate ? "Новое пополнение" : `Пополнение #${topUp?.id}`}
            </h2>
            {!isCreate && statusInfo && (
              <Badge size="sm" color={statusInfo.color}>{statusInfo.label}</Badge>
            )}
          </div>
          {!isCreate && topUp && (
            <p className="text-sm tabular-nums text-gray-500 dark:text-gray-400">{formatDateTime(topUp.createdAt)}</p>
          )}
        </div>

        {serverError && (
          <div role="alert" className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
            {serverError}
          </div>
        )}

        {isCreate ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <CustomerSelector
                selectedCustomer={selectedCustomer}
                onSelectCustomer={(customer) => {
                  setSelectedCustomer(customer);
                  if (errors.customer) {
                    setErrors((prev) => ({ ...prev, customer: "" }));
                  }
                }}
                placeholder="Выберите клиента"
              />
              {errors.customer && (
                <p className="mt-1 text-xs text-error-600 dark:text-error-500">{errors.customer}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="topup-amount" className={fieldLabelClass}>
                  Сумма, ₸
                </label>
                <input
                  id="topup-amount"
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
                  className={`${controlClass} w-full ${errors.amount ? "border-error-500 dark:border-error-500" : ""}`}
                />
                {errors.amount && (
                  <p className="mt-1 text-xs text-error-600 dark:text-error-500">{errors.amount}</p>
                )}
              </div>
              <div>
                <label htmlFor="topup-method" className={fieldLabelClass}>
                  Способ оплаты
                </label>
                <select
                  id="topup-method"
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  className={`${controlClass} w-full`}
                >
                  {methodOptions}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="topup-comment" className={fieldLabelClass}>
                Комментарий
              </label>
              <textarea
                id="topup-comment"
                value={adminComment}
                onChange={(event) => setAdminComment(event.target.value)}
                rows={3}
                className={`${controlClass} h-auto w-full py-2`}
              />
            </div>

            {footer("Создать", "Отмена")}
          </form>
        ) : topUp ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2">
                <dt className="text-gray-500 dark:text-gray-400">Клиент</dt>
                <dd className="text-gray-800 dark:text-white/90">
                  {topUp.clientName || `Клиент #${topUp.clientId}`}
                  {(topUp.clientEmail || topUp.clientPhone) && (
                    <span className="text-gray-500 dark:text-gray-400">
                      {", "}
                      {[topUp.clientEmail, topUp.clientPhone].filter(Boolean).join(", ")}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Сумма</dt>
                <dd className="font-medium tabular-nums text-gray-800 dark:text-white/90">{formatKzt(topUp.amount)}</dd>
              </div>
            </dl>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="topup-status" className={fieldLabelClass}>
                  Статус
                </label>
                <select
                  id="topup-status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className={`${controlClass} w-full`}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="topup-method" className={fieldLabelClass}>
                  Способ оплаты
                </label>
                <select
                  id="topup-method"
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  className={`${controlClass} w-full`}
                >
                  {methodOptions}
                </select>
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Чек</span>
                {topUp.receiptUrl && receiptLinkHref && (
                  <a
                    href={receiptLinkHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Открыть оригинал
                  </a>
                )}
              </div>
              {topUp.receiptUrl ? (
                <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
                  <ReceiptPreview candidates={receiptUrlCandidates} alt="Чек пополнения" />
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">Чек не прикреплен</p>
              )}
            </div>

            <div>
              <label htmlFor="topup-comment" className={fieldLabelClass}>
                Комментарий
              </label>
              <textarea
                id="topup-comment"
                value={adminComment}
                onChange={(event) => setAdminComment(event.target.value)}
                rows={3}
                className={`${controlClass} h-auto w-full py-2`}
              />
            </div>

            {footer("Сохранить", "Закрыть")}
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
  <div className="flex h-48 w-full items-center justify-center bg-gray-100 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
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
      className="h-48 w-full bg-gray-100 object-contain dark:bg-gray-800"
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
