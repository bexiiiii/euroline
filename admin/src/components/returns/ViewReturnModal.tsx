"use client";
import React from "react";
import { Modal } from "../ui/modal";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import type { ReturnTableItem } from "./ReturnsTable";
import { formatKzt, formatDateTime } from "@/lib/format";

interface ViewReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  returnData: ReturnTableItem | null;
}

const ViewReturnModal: React.FC<ViewReturnModalProps> = ({
  isOpen,
  onClose,
  returnData,
}) => {
  if (!returnData) return null;

  const statusColor = (() => {
    switch (returnData.statusCode) {
      case "NEW":
        return "warning" as const;
      case "PROCESSED":
        return "info" as const;
      case "APPROVED":
        return "success" as const;
      case "REJECTED":
        return "error" as const;
      default:
        return "light" as const;
    }
  })();

  const fields: { label: string; value: React.ReactNode; wide?: boolean }[] = [
    { label: "Заказ", value: returnData.originalOrderNumber },
    { label: "Клиент", value: returnData.customer.name },
    { label: "Дата запроса", value: formatDateTime(returnData.requestDate) },
    {
      label: "Сумма",
      value: (
        <span className="font-medium tabular-nums">
          {returnData.statusCode === "REJECTED" ? "—" : formatKzt(returnData.totalRefund)}
        </span>
      ),
    },
    { label: "Причина", value: returnData.reason || "—", wide: true },
  ];
  if (returnData.customer.email) fields.splice(2, 0, { label: "Эл. почта", value: returnData.customer.email });
  if (returnData.customer.phone) fields.splice(2, 0, { label: "Телефон", value: returnData.customer.phone });

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-5">
        <div className="mb-4 flex items-center gap-2 pr-10">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Возврат {returnData.returnNumber}
          </h2>
          <Badge size="sm" variant="light" color={statusColor}>
            {returnData.status}
          </Badge>
        </div>

        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.label} className={f.wide ? "sm:col-span-2" : ""}>
              <dt className="text-xs text-gray-500 dark:text-gray-400">{f.label}</dt>
              <dd className="whitespace-pre-line text-sm text-gray-800 dark:text-white/90">{f.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 flex justify-end">
          <Button size="sm" variant="outline" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ViewReturnModal;
