"use client";

import React from "react";
import { Modal } from "../ui/modal";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import { RefundRequest } from "@/lib/api/finance";
import { formatDateTime, formatKzt } from "@/lib/format";

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

const ViewRefundModal: React.FC<ViewRefundModalProps> = ({ isOpen, onClose, refundData }) => {
  if (!isOpen || !refundData) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" className="p-0">
      <div className="space-y-4 p-5">
        <div className="flex items-center gap-2 pr-12">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">Возврат #{refundData.id}</h2>
          <Badge color={statusColor(refundData.status)} size="sm">
            {statusLabels[refundData.status] ?? refundData.status}
          </Badge>
        </div>

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
          {refundData.adminComment && (
            <div className="col-span-2">
              <dt className="text-gray-500 dark:text-gray-400">Комментарий</dt>
              <dd className="text-gray-800 dark:text-white/90">{refundData.adminComment}</dd>
            </div>
          )}
        </dl>

        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ViewRefundModal;
