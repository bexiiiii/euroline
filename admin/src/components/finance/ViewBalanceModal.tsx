"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "../ui/modal";
import Badge from "../ui/badge/Badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "../ui/table";
import { ClientBalance, financeApi, TransactionDetail } from "@/lib/api/finance";

interface ViewBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountData: ClientBalance | null;
}

const typeLabels: Record<string, string> = {
  TOPUP: "Пополнение",
  CHARGE: "Списание",
  REFUND: "Возврат",
  RETURN: "Возврат товара",
  ADJUST: "Корректировка",
};

const typeColors: Record<string, "success" | "error" | "warning" | "info" | "light"> = {
  TOPUP: "success",
  CHARGE: "error",
  REFUND: "warning",
  RETURN: "info",
  ADJUST: "light",
};

const ViewBalanceModal: React.FC<ViewBalanceModalProps> = ({ isOpen, onClose, accountData }) => {
  const [transactions, setTransactions] = useState<TransactionDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !accountData) {
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await financeApi.getTransactionDetails(accountData.clientId, 0, 50);
        const normalized: TransactionDetail[] = (response.content ?? []).map((txn) => ({
          ...txn,
          amount: typeof txn.amount === "string" ? Number(txn.amount) : txn.amount,
          products: txn.products ?? [],
        }));
        setTransactions(normalized);
      } catch (err) {
        console.error("Не удалось загрузить транзакции клиента", err);
        setTransactions([]);
        setError("Не удалось загрузить историю транзакций");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isOpen, accountData]);

  const formattedBalance = useMemo(() => {
    if (!accountData) return "";
    return formatCurrency(accountData.balance);
  }, [accountData]);

  if (!accountData) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <div className="p-6 space-y-6">
        <header className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Баланс {accountData.establishmentName || accountData.displayName || `пользователя #${accountData.clientId}`}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Клиент #{accountData.clientId}
              {accountData.displayName && accountData.displayName !== accountData.establishmentName && (
                <>
                  <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
                  <span>{accountData.displayName}</span>
                </>
              )}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Обновлено: {formatDate(accountData.updatedAt)}
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-xl bg-gray-50 p-4 text-sm text-gray-600 dark:bg-white/[0.02] dark:text-gray-300 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Текущий остаток: {" "}
              <strong className="text-gray-900 dark:text-white">{formattedBalance}</strong>
            </span>
            <div className="flex flex-col gap-1 sm:items-end">
              {accountData.establishmentName && (
                <span className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  {accountData.establishmentName}
                </span>
              )}
              {accountData.email && (
                <span className="text-xs text-gray-500 dark:text-gray-400">{accountData.email}</span>
              )}
              {accountData.phone && (
                <span className="text-xs text-gray-500 dark:text-gray-400">{accountData.phone}</span>
              )}
            </div>
          </div>
        </header>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            История транзакций
          </h3>

          {loading && (
            <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Загрузка транзакций...
            </div>
          )}

          {!loading && error && (
            <div className="p-6 text-center text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {!loading && !error && transactions.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
              История транзакций пуста
            </div>
          )}

          {!loading && !error && transactions.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-white/[0.06]">
              <div className="max-h-[420px] overflow-y-auto">
                <Table className="min-w-full divide-y divide-gray-200 dark:divide-white/[0.05]">
                  <TableHeader className="bg-gray-50 dark:bg-white/[0.02]">
                    <TableRow>
                      <TableCell
                        isHeader
                        className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                      >
                        Тип операции
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                      >
                        Дата и время
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                      >
                        Сумма
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                      >
                        Детали
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                      >
                        Связанная запись
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-200 dark:divide-white/[0.04] bg-white dark:bg-white/[0.01]">
                    {transactions.map((txn) => {
                      const products = txn.products ?? [];
                      const hasProducts = products.length > 0;
                      const orderLabel = txn.orderPublicCode || (txn.orderId ? `Order #${txn.orderId}` : null);
                      return (
                        <React.Fragment key={txn.id}>
                          <TableRow className="hover:bg-gray-50/80 dark:hover:bg-white/[0.03]">
                            <TableCell className="px-5 py-4 align-top">
                              <div className="flex flex-col gap-1">
                                <Badge variant="light" color={typeColors[txn.type] ?? "light"}>
                                  {typeLabels[txn.type] ?? txn.type}
                                </Badge>
                                {hasProducts && (
                                  <span className="text-xs text-gray-400 dark:text-gray-500">
                                    {products.length} тов.
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-5 py-4 align-top text-sm text-gray-600 dark:text-gray-300">
                              {formatDate(txn.createdAt)}
                            </TableCell>
                            <TableCell className="px-5 py-4 align-top">
                              <span
                                className={`text-sm font-semibold ${
                                  txn.type === "CHARGE"
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-green-600 dark:text-green-400"
                                }`}
                              >
                                {formatSignedCurrency(txn)}
                              </span>
                            </TableCell>
                            <TableCell className="px-5 py-4 align-top text-sm text-gray-600 dark:text-gray-300">
                              {txn.description ? txn.description : "—"}
                            </TableCell>
                            <TableCell className="px-5 py-4 align-top text-sm text-gray-600 dark:text-gray-300">
                              {orderLabel ? (
                                <span className="font-medium text-gray-900 dark:text-white">{orderLabel}</span>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                          </TableRow>
                          {hasProducts && (
                            <TableRow className="bg-gray-50/60 dark:bg-white/[0.02]">
                              <TableCell colSpan={5} className="px-5 pb-4 pt-0">
                                <div className="mt-3 overflow-hidden rounded-xl border border-gray-200/60 dark:border-white/[0.06]">
                                  <Table className="min-w-full">
                                    <TableHeader className="bg-gray-100/80 dark:bg-white/[0.04]">
                                      <TableRow>
                                        <TableCell
                                          isHeader
                                          className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                                        >
                                          Товар
                                        </TableCell>
                                        <TableCell
                                          isHeader
                                          className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                                        >
                                          Код
                                        </TableCell>
                                        <TableCell
                                          isHeader
                                          className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                                        >
                                          Бренд
                                        </TableCell>
                                        <TableCell
                                          isHeader
                                          className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                                        >
                                          Кол-во
                                        </TableCell>
                                        <TableCell
                                          isHeader
                                          className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                                        >
                                          Цена
                                        </TableCell>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                                      {products.map((product, index) => (
                                        <TableRow key={`${txn.id}-${product.productCode ?? index}-${index}`}>
                                          <TableCell className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                            {product.productName || product.name || "—"}
                                          </TableCell>
                                          <TableCell className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                                            {product.productCode || "—"}
                                          </TableCell>
                                          <TableCell className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                                            {product.brand || "—"}
                                          </TableCell>
                                          <TableCell className="px-4 py-2 text-right text-sm text-gray-600 dark:text-gray-300">
                                            {product.quantity}
                                          </TableCell>
                                          <TableCell className="px-4 py-2 text-right text-sm text-gray-900 dark:text-white">
                                            {formatCurrency(product.price)}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
};

function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  const numeric = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(numeric)) return "—";
  return new Intl.NumberFormat("kk-KZ", {
    style: "currency",
    currency: "KZT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numeric);
}

function formatSignedCurrency(txn: TransactionDetail): string {
  const formatted = formatCurrency(txn.amount);
  if (txn.type === "CHARGE") {
    return `− ${formatted}`;
  }
  if (txn.type === "TOPUP" || txn.type === "REFUND" || txn.type === "RETURN") {
    return `+ ${formatted}`;
  }
  return formatted;
}

function formatDate(value: string | number | Date | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("ru-RU");
}

export default ViewBalanceModal;
