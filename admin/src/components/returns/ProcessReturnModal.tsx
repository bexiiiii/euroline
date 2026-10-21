"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import { formatKzt } from "@/lib/format";
import type { ReturnTableItem, ReturnStatusLabel } from "./ReturnsTable";

interface ProcessReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (returnId: number, status: ReturnStatusLabel, refundAmount?: number, notes?: string) => Promise<void> | void;
  returnData: ReturnTableItem | null;
}

const ProcessReturnModal: React.FC<ProcessReturnModalProps> = ({
  isOpen,
  onClose,
  onSave,
  returnData,
}) => {
  const [status, setStatus] = useState<ReturnStatusLabel>("В обработке");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (returnData) {
      setStatus(returnData.status);
      setNotes("");
      setSubmitError(null);
    }
  }, [returnData]);

  if (!returnData) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError(null);

    try {
      await onSave(returnData.id, status, undefined, notes);
      onClose();
    } catch (error) {
      console.error("Ошибка при обработке возврата:", error);
      setSubmitError(
        error instanceof Error && error.message
          ? error.message
          : "Не удалось сохранить изменения. Попробуйте ещё раз."
      );
    } finally {
      setLoading(false);
    }
  };

  const statusOptions: ReturnStatusLabel[] = [
    "Запрос на возврат",
    "В обработке",
    "Одобрен",
    "Отклонен",
    "Возврат завершен",
  ];

  const fieldClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-5">
        <div className="mb-4 pr-10">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Возврат {returnData.returnNumber}
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {returnData.customer.name} · {formatKzt(returnData.totalRefund)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Статус
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ReturnStatusLabel)}
              required
              className={`${fieldClass} h-11`}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Комментарий
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={`${fieldClass} resize-none py-2.5`}
            />
          </div>

          {submitError && (
            <div role="alert" className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600 dark:bg-error-500/15 dark:text-error-500">
              {submitError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button size="sm" type="submit" disabled={loading}>
              {loading ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ProcessReturnModal;
