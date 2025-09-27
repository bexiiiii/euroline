"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";
import { RefundRequest } from "@/lib/api/finance";

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

  const formatCurrency = useMemo(
    () =>
      (amount?: number | null) =>
        new Intl.NumberFormat("kk-KZ", {
          style: "currency",
          currency: "KZT",
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(amount ?? 0),
    []
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("ru-RU");
  };

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

  const showApprovedNotice = status === "APPROVED";
  const showRejectedNotice = status === "REJECTED";

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Обработка возврата</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Заявка #{refundData.id} · Текущий статус: {currentStatusLabel}
            </p>
          </div>
          <Badge color={statusMetaColor(refundData.status)} size="sm">
            {currentStatusLabel}
          </Badge>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900/40 rounded-lg">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Клиент</p>
            <p className="text-sm text-gray-900 dark:text-white">
              {refundData.clientName || `Клиент #${refundData.clientId ?? refundData.userId ?? "—"}`}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {[refundData.clientEmail, refundData.clientPhone].filter(Boolean).join(" • ") || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Заказ</p>
            <p className="text-sm text-gray-900 dark:text-white">{refundData.orderId ? `#${refundData.orderId}` : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Сумма возврата</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(refundData.amount)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Дата запроса</p>
            <p className="text-sm text-gray-900 dark:text-white">{formatDate(refundData.createdAt)}</p>
          </div>
          {refundData.paymentMethod && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Способ возврата</p>
              <p className="text-sm text-gray-900 dark:text-white">{refundData.paymentMethod}</p>
            </div>
          )}
        </div>

        {refundData.reason && (
          <div className="p-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Причина возврата</p>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">{refundData.reason}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Новый статус
            </label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as RefundRequest["status"])}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Комментарий администратора
            </label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Опишите принятое решение..."
            />
          </div>

          {showApprovedNotice && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-800 dark:text-green-200">
              После принятия средства автоматически вернутся на баланс клиента.
            </div>
          )}

          {showRejectedNotice && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
              Укажите причину отказа в комментарии.
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Отменить
            </button>
            <Button type="submit" variant="primary" size="sm" disabled={loading}>
              {loading ? "Сохраняем…" : "Сохранить"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ProcessRefundModal;
