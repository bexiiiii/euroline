"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";
import { ClientBalance } from "@/lib/api/finance";
import { formatKzt } from "@/lib/format";
import { controlClass, fieldLabelClass } from "./tableUi";

interface AccountBalanceSummary extends ClientBalance {
  customerId?: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  currentBalance?: number;
  availableBalance?: number;
  blockedBalance?: number;
  totalTopUps?: number;
  totalSpent?: number;
  lastTransactionDate?: string;
  accountStatus?: "active" | "suspended" | "blocked";
  registrationDate?: string;
}

interface AdjustBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountData: AccountBalanceSummary | null;
  onSave: (
    accountId: number,
    adjustmentType: "add" | "subtract",
    amount: number,
    reason: string
  ) => Promise<void> | void;
}

const AdjustBalanceModal: React.FC<AdjustBalanceModalProps> = ({
  isOpen,
  onClose,
  accountData,
  onSave,
}) => {
  const [adjustmentType, setAdjustmentType] = useState<"add" | "subtract">("add");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const currentBalance = useMemo(() => {
    if (!accountData) return 0;
    if (typeof accountData.currentBalance === "number") return accountData.currentBalance;
    return accountData.balance ?? 0;
  }, [accountData]);

  const availableBalance = useMemo(() => {
    if (!accountData) return 0;
    if (typeof accountData.availableBalance === "number") return accountData.availableBalance;
    return currentBalance;
  }, [accountData, currentBalance]);

  const blockedBalance = useMemo(() => {
    if (!accountData) return 0;
    if (typeof accountData.blockedBalance === "number") return accountData.blockedBalance;
    return 0;
  }, [accountData]);

  const establishmentName = useMemo(() => {
    if (!accountData) return undefined;
    return (
      accountData.establishmentName ??
      accountData.customerName ??
      undefined
    );
  }, [accountData]);

  const contactName = useMemo(() => {
    if (!accountData) return undefined;
    return (
      accountData.contactName ??
      accountData.customerName ??
      accountData.email ??
      accountData.customerEmail ??
      undefined
    );
  }, [accountData]);

  const email = useMemo(() => {
    if (!accountData) return undefined;
    return accountData.email ?? accountData.customerEmail ?? undefined;
  }, [accountData]);

  const phone = useMemo(() => {
    if (!accountData) return undefined;
    return accountData.phone ?? accountData.customerPhone ?? undefined;
  }, [accountData]);

  useEffect(() => {
    if (isOpen) {
      setAdjustmentType("add");
      setAmount("");
      setReason("");
      setErrors({});
    }
  }, [isOpen]);

  const calculateNewBalance = () => {
    if (!accountData || !amount) return currentBalance;

    const delta = parseFloat(amount);
    if (Number.isNaN(delta)) return currentBalance;

    return adjustmentType === "add" ? currentBalance + delta : currentBalance - delta;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accountData) return;

    const validationErrors: Record<string, string> = {};

    if (!amount.trim()) {
      validationErrors.amount = "Введите сумму корректировки";
    } else if (parseFloat(amount) <= 0) {
      validationErrors.amount = "Сумма должна быть больше 0";
    }

    if (!reason.trim()) {
      validationErrors.reason = "Укажите причину корректировки";
    }

    if (adjustmentType === "subtract") {
      const delta = parseFloat(amount);
      if (!Number.isNaN(delta) && delta > currentBalance) {
        validationErrors.amount = "Сумма списания не может превышать текущий баланс";
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await onSave(accountData.clientId, adjustmentType, parseFloat(amount), reason.trim());
      onClose();
    } catch (error) {
      console.error("Ошибка при корректировке баланса", error);
    } finally {
      setLoading(false);
    }
  };

  if (!accountData) {
    return null;
  }

  const newBalance = calculateNewBalance();
  const contactLine = [
    contactName && contactName !== establishmentName ? contactName : null,
    email,
    phone,
  ]
    .filter(Boolean)
    .join(", ");
  const segmentClass = (active: boolean) =>
    `h-10 rounded-lg text-sm font-medium transition-colors ${
      active
        ? "bg-white text-gray-800 shadow-theme-xs dark:bg-gray-800 dark:text-white/90"
        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
    }`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" className="p-0">
      <div className="space-y-4 p-5">
        <div className="pr-12">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">Корректировка баланса</h2>
            {accountData.accountStatus && (
              <Badge size="sm" color={mapStatusToColor(accountData.accountStatus)}>
                {mapStatusToLabel(accountData.accountStatus)}
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {establishmentName ?? contactName ?? `Клиент #${accountData.clientId}`}
            {contactLine && `, ${contactLine}`}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Текущий баланс</dt>
            <dd className="font-medium tabular-nums text-gray-800 dark:text-white/90">{formatKzt(currentBalance)}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Доступно</dt>
            <dd className="font-medium tabular-nums text-gray-800 dark:text-white/90">{formatKzt(availableBalance)}</dd>
          </div>
          {blockedBalance > 0 && (
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Заморожено</dt>
              <dd className="font-medium tabular-nums text-gray-800 dark:text-white/90">{formatKzt(blockedBalance)}</dd>
            </div>
          )}
        </dl>

        <form onSubmit={handleSubmit} className="space-y-4 border-t border-gray-200 pt-4 dark:border-gray-800">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <span className={fieldLabelClass}>Операция</span>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1 dark:bg-white/[0.04]" role="group" aria-label="Тип корректировки">
                <button
                  type="button"
                  aria-pressed={adjustmentType === "add"}
                  onClick={() => setAdjustmentType("add")}
                  className={segmentClass(adjustmentType === "add")}
                >
                  Пополнение
                </button>
                <button
                  type="button"
                  aria-pressed={adjustmentType === "subtract"}
                  onClick={() => setAdjustmentType("subtract")}
                  className={segmentClass(adjustmentType === "subtract")}
                >
                  Списание
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="amount" className={fieldLabelClass}>
                Сумма, ₸
              </label>
              <input
                id="amount"
                type="number"
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value);
                  if (errors.amount) {
                    setErrors((prev) => ({ ...prev, amount: "" }));
                  }
                }}
                min="0.01"
                step="0.01"
                required
                className={`${controlClass} w-full ${errors.amount ? "border-error-500 dark:border-error-500" : ""}`}
                placeholder="0"
              />
              {errors.amount && <p className="mt-1 text-xs text-error-600 dark:text-error-500">{errors.amount}</p>}
            </div>
          </div>

          {amount && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Новый баланс:{" "}
              <span
                className={`font-medium tabular-nums ${
                  newBalance >= 0 ? "text-gray-800 dark:text-white/90" : "text-error-600 dark:text-error-500"
                }`}
              >
                {formatKzt(newBalance)}
              </span>
            </p>
          )}

          <div>
            <label htmlFor="reason" className={fieldLabelClass}>
              Причина
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                if (errors.reason) {
                  setErrors((prev) => ({ ...prev, reason: "" }));
                }
              }}
              rows={3}
              required
              className={`${controlClass} h-auto w-full py-2 ${errors.reason ? "border-error-500 dark:border-error-500" : ""}`}
            />
            {errors.reason && <p className="mt-1 text-xs text-error-600 dark:text-error-500">{errors.reason}</p>}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={loading}>
              {loading ? "Сохранение…" : adjustmentType === "add" ? "Пополнить" : "Списать"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

function mapStatusToLabel(status: "active" | "suspended" | "blocked" | string): string {
  switch (status) {
    case "active":
      return "Активен";
    case "suspended":
      return "Приостановлен";
    case "blocked":
      return "Заблокирован";
    default:
      return status;
  }
}

function mapStatusToColor(status: "active" | "suspended" | "blocked" | string): "success" | "warning" | "error" | "light" {
  switch (status) {
    case "active":
      return "success";
    case "suspended":
      return "warning";
    case "blocked":
      return "error";
    default:
      return "light";
  }
}

export default AdjustBalanceModal;
