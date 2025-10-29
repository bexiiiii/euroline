"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";
import { ClientBalance } from "@/lib/api/finance";

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

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("kk-KZ", {
      style: "currency",
      currency: "KZT",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Корректировка баланса</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Изменение баланса клиента с указанием причины
          </p>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <h3 className="mb-3 text-lg font-medium text-gray-900 dark:text-white">Информация о клиенте</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Клиент:</span>
                <span className="ml-2 text-sm text-gray-900 dark:text-white">
                  {establishmentName ?? contactName ?? `Клиент #${accountData.clientId}`}
                </span>
              </div>
              {contactName && establishmentName && contactName !== establishmentName && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Контакт:</span>
                  <span className="ml-2 text-sm text-gray-900 dark:text-white">{contactName}</span>
                </div>
              )}
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Email:</span>
                <span className="ml-2 text-sm text-gray-900 dark:text-white">
                  {email ?? "—"}
                </span>
              </div>
              {phone && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Телефон:</span>
                  <span className="ml-2 text-sm text-gray-900 dark:text-white">{phone}</span>
                </div>
              )}
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Текущий баланс:</span>
                <span className="ml-2 text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {formatCurrency(currentBalance)}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Доступно:</span>
                <span className="ml-2 text-lg font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(availableBalance)}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Заморожено:</span>
                <span className="ml-2 text-sm text-gray-900 dark:text-white">
                  {formatCurrency(blockedBalance)}
                </span>
              </div>
              {accountData.accountStatus && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Статус:</span>
                  <span className="ml-2 inline-flex">
                    <Badge variant="light" color={mapStatusToColor(accountData.accountStatus)}>
                      {mapStatusToLabel(accountData.accountStatus)}
                    </Badge>
                  </span>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Тип корректировки *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustmentType("add")}
                  className={`rounded-lg border p-3 text-center transition-colors ${
                    adjustmentType === "add"
                      ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                      : "border-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="text-lg font-semibold">+ Пополнение</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Добавить средства</div>
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType("subtract")}
                  className={`rounded-lg border p-3 text-center transition-colors ${
                    adjustmentType === "subtract"
                      ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                      : "border-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="text-lg font-semibold">- Списание</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Списать средства</div>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="amount" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Сумма корректировки *
              </label>
              <div className="relative">
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
                  className={`w-full rounded-lg border px-3 py-2 text-gray-900 shadow-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
                    errors.amount ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="0.00"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400">
                  ₸
                </div>
              </div>
              {errors.amount && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.amount}</p>}
            </div>

            {amount && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700 dark:text-blue-300">Новый баланс после корректировки:</span>
                  <span
                    className={`text-lg font-semibold ${
                      calculateNewBalance() >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {formatCurrency(calculateNewBalance())}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="reason" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Причина корректировки *
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
                className={`w-full rounded-lg border px-3 py-2 text-gray-900 shadow-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
                  errors.reason ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder="Укажите причину изменения баланса..."
              />
              {errors.reason && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.reason}</p>}
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Причина будет зафиксирована в истории операций</p>
            </div>

            <div className="flex justify-end space-x-3 border-t border-gray-200 pt-4 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Отменить
              </button>
              <Button variant="primary" size="sm" disabled={loading}>
                {loading
                  ? "Обработка..."
                  : adjustmentType === "add"
                  ? "Пополнить баланс"
                  : "Списать с баланса"}
              </Button>
            </div>
          </form>
        </div>
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
