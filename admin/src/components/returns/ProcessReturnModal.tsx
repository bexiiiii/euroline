"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import { ReturnStatus } from "@/lib/api/returns";
import type { ReturnTableItem, ReturnStatusLabel } from "./ReturnsTable";

interface ProcessReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (returnId: number, status: ReturnStatusLabel, refundAmount?: number, notes?: string) => void;
  returnData: ReturnTableItem | null;
}

const ProcessReturnModal: React.FC<ProcessReturnModalProps> = ({
  isOpen,
  onClose,
  onSave,
  returnData,
}) => {
  const [status, setStatus] = useState<ReturnStatusLabel>("В обработке");
  const [refundAmount, setRefundAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (returnData) {
      setStatus(returnData.status);
      setRefundAmount(returnData.totalRefund);
      setNotes("");
    }
  }, [returnData]);

  if (!returnData) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave(returnData.id, status, refundAmount, notes);
      onClose();
    } catch (error) {
      console.error("Ошибка при обработке возврата:", error);
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: "Запрос на возврат", label: "Запрос на возврат", disabled: false },
    { value: "В обработке", label: "В обработке", disabled: false },
    { value: "Одобрен", label: "Одобрен", disabled: false },
    { value: "Отклонен", label: "Отклонен", disabled: false },
    { value: "Возврат завершен", label: "Возврат завершен", disabled: false },
  ];

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "KZT",
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Обработка возврата {returnData.returnNumber}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Return Info */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              Информация о возврате
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Номер возврата:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{returnData.returnNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Клиент:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{returnData.customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Запрашиваемая сумма:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(returnData.totalRefund)}</span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Статус возврата *
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ReturnStatusLabel)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Refund Amount */}
          {(status === "Одобрен" || status === "Возврат завершен") && (
            <div>
              <label htmlFor="refundAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Сумма к возврату *
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="refundAmount"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  required
                  min="0"
                  max={returnData.totalRefund}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white pr-12"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">₸</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Максимальная сумма: {formatCurrency(returnData.totalRefund)}
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Комментарий к обработке
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Введите дополнительные комментарии..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Отмена
            </Button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-50 rounded-lg transition"
            >
              {loading ? "Обработка..." : "Сохранить"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ProcessReturnModal;
