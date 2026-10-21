"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";
import { RefundRequest } from "@/lib/api/finance";
import { formatDateTime, formatKzt } from "@/lib/format";
import { controlClass, fieldLabelClass } from "./tableUi";

interface ProcessRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  refundData: (RefundRequest & {
    clientName?: string;
    clientEmail?: string;
    clientPhone?: string;
    paymentMethod?: string;
  }) | null;
  onSave: (refundId: number, status: RefundRequest["status"], notes?: string) => Promise<void> | void;
}

const statusLabels: Record<RefundRequest["status"], string> = {
  NEW: "В ожидании",
  IN_REVIEW: "На рассмотрении",
  APPROVED: "Принят",
  REJECTED: "Отклонён",
  DONE: "Выплачен",
};

const statusMetaColor = (status: RefundRequest["status"]): React.ComponentProps<typeof Badge>["color"] => {
  switch (status) {
    case "NEW":
      return "warning";
    case "IN_REVIEW":
      return "info";
    case "APPROVED":
      return "success";
    case "REJECTED":
      return "error";
    case "DONE":
      return "dark";
    default:
      return "light";
  }
};

const statusOptions: Array<{ value: RefundRequest["status"]; label: string; disabled?: boolean }> = [
  { value: "NEW", label: "В ожидании", disabled: true },
  { value: "IN_REVIEW", label: "На рассмотрении" },
  { value: "APPROVED", label: "Принять" },
  { value: "REJECTED", label: "Отклонить" },
  { value: "DONE", label: "Выплачен" },
];

const ProcessRefundModal: React.FC<ProcessRefundModalProps> = ({
  isOpen,
  onClose,
  refundData,
  onSave,
}) => {
  const [status, setStatus] = useState<RefundRequest["status"]>("IN_REVIEW");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (refundData) {
      setStatus(refundData.status ?? "IN_REVIEW");
      setNotes(refundData.adminComment ?? "");
      setError(null);
    }
  }, [refundData]);

  if (!isOpen || !refundData) {
    return null;
  }

  const currentStatusLabel = statusLabels[refundData.status] ?? refundData.status;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSave(refundData.id, status, notes.trim() ? notes.trim() : undefined);
      onClose();
    } catch (err) {
      console.error("Ошибка при обновлении статуса возврата", err);
      setError(err instanceof Error ? err.message : "Не удалось обновить статус возврата");
    } finally {
      setLoading(false);
    }
  };

  const statusHint =
    status === "APPROVED"
      ? "Средства вернутся на баланс клиента."
      : status === "REJECTED"
        ? "Укажите причину отказа в комментарии."
        : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" className="p-0">
      <div className="space-y-4 p-5">
        <div className="flex items-center gap-2 pr-12">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">Возврат #{refundData.id}</h2>
          <Badge color={statusMetaColor(refundData.status)} size="sm">
            {currentStatusLabel}
          </Badge>
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
            {error}
          </div>
        )}

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="col-span-2">
            <dt className="text-gray-500 dark:text-gray-400">Клиент</dt>
            <dd className="text-gray-800 dark:text-white/90">
              {refundData.clientName || `Клиент #${refundData.clientId ?? refundData.userId ?? "—"}`}
              {(refundData.clientEmail || refundData.clientPhone) && (
                <span className="text-gray-500 dark:text-gray-400">
                  {", "}
                  {[refundData.clientEmail, refundData.clientPhone].filter(Boolean).join(", ")}
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Сумма</dt>
            <dd className="font-medium tabular-nums text-gray-800 dark:text-white/90">{formatKzt(refundData.amount ?? 0)}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Заказ</dt>
            <dd className="text-gray-800 dark:text-white/90">{refundData.orderId ? `#${refundData.orderId}` : "—"}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Создана</dt>
            <dd className="tabular-nums text-gray-800 dark:text-white/90">{formatDateTime(refundData.createdAt)}</dd>
          </div>
          {refundData.paymentMethod && (
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Способ возврата</dt>
              <dd className="text-gray-800 dark:text-white/90">{refundData.paymentMethod}</dd>
            </div>
          )}
          {refundData.reason && (
            <div className="col-span-2">
              <dt className="text-gray-500 dark:text-gray-400">Причина</dt>
              <dd className="text-gray-800 dark:text-white/90">{refundData.reason}</dd>
            </div>
          )}
        </dl>

        <form onSubmit={handleSubmit} className="space-y-4 border-t border-gray-200 pt-4 dark:border-gray-800">
          <div>
            <label htmlFor="refund-status" className={fieldLabelClass}>
              Новый статус
            </label>
            <select
              id="refund-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as RefundRequest["status"])}
              className={`${controlClass} w-full`}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
            </select>
            {statusHint && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{statusHint}</p>}
          </div>

          <div>
            <label htmlFor="refund-notes" className={fieldLabelClass}>
              Комментарий
            </label>
            <textarea
              id="refund-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              className={`${controlClass} h-auto w-full py-2`}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={loading}>
              {loading ? "Сохранение…" : "Сохранить"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ProcessRefundModal;
