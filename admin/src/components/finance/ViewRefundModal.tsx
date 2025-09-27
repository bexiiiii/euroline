"use client";

import React from "react";
import { Modal } from "../ui/modal";
import Badge from "../ui/badge/Badge";
import { RefundRequest } from "@/lib/api/finance";

interface ViewRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  refundData: (RefundRequest & {
    clientName?: string;
    clientEmail?: string;
    clientPhone?: string;
    paymentMethod?: string;
    reason?: string;
  }) | null;
}

const statusLabels: Record<RefundRequest["status"], string> = {
  NEW: "В ожидании",
  IN_REVIEW: "На рассмотрении",
  APPROVED: "Принят",
  REJECTED: "Отклонён",
  DONE: "Выплачен",
};

const statusColor = (status: RefundRequest["status"]): React.ComponentProps<typeof Badge>["color"] => {
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

const formatCurrency = (amount?: number | null) =>
  new Intl.NumberFormat("kk-KZ", {
    style: "currency",
    currency: "KZT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount ?? 0);

const formatDate = (value?: string) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("ru-RU");
};

const ViewRefundModal: React.FC<ViewRefundModalProps> = ({ isOpen, onClose, refundData }) => {
  if (!isOpen || !refundData) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Детали возврата</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Заявка #{refundData.id}</p>
          </div>
          <Badge color={statusColor(refundData.status)} size="sm">
            {statusLabels[refundData.status] ?? refundData.status}
          </Badge>
        </div>

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
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Сумма</p>
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
          {refundData.adminComment && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Комментарий администратора</p>
              <p className="text-sm text-gray-900 dark:text-white">{refundData.adminComment}</p>
            </div>
          )}
        </div>

        {refundData.reason && (
          <div className="p-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Причина возврата</p>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">{refundData.reason}</p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Закрыть
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ViewRefundModal;
