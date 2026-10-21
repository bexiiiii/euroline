"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "../ui/modal";
import Badge from "../ui/badge/Badge";
import { ClientBalance, financeApi, TransactionDetail } from "@/lib/api/finance";
import { formatDateTime, formatKzt } from "@/lib/format";
import { tbodyClass, tdClass, thClass, theadClass } from "./tableUi";

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
    return formatKzt(accountData.balance);
  }, [accountData]);

  if (!accountData) {
    return null;
  }

  const contactLine = [
    accountData.contactName && accountData.contactName !== accountData.establishmentName ? accountData.contactName : null,
    accountData.email,
    accountData.phone,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" className="p-0">
      <div className="space-y-4 p-5">
        <div className="pr-12">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
            {accountData.establishmentName || accountData.contactName || `Клиент #${accountData.clientId}`}
          </h2>
          {contactLine && <p className="text-sm text-gray-500 dark:text-gray-400">{contactLine}</p>}
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Остаток</dt>
            <dd className="text-base font-semibold tabular-nums text-gray-800 dark:text-white/90">{formattedBalance}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Обновлен</dt>
            <dd className="tabular-nums text-gray-800 dark:text-white/90">{formatDateTime(accountData.updatedAt)}</dd>
          </div>
        </dl>

        <section className="space-y-3">
          <h3 className="text-sm font-medium text-gray-800 dark:text-white/90">Транзакции</h3>

          {loading && <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">Загрузка…</p>}

          {!loading && error && (
            <p className="py-4 text-center text-sm text-error-600 dark:text-error-500">{error}</p>
          )}

          {!loading && !error && transactions.length === 0 && (
            <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">Транзакций пока нет</p>
          )}

          {!loading && !error && transactions.length > 0 && (
            <div className="max-h-[420px] overflow-auto rounded-lg border border-gray-200 dark:border-gray-800">
              <table className="w-full min-w-[640px]">
                <thead className={theadClass}>
                  <tr>
                    <th className={thClass}>Тип</th>
                    <th className={thClass}>Дата</th>
                    <th className={`${thClass} text-right`}>Сумма</th>
                    <th className={thClass}>Детали</th>
                    <th className={thClass}>Заказ</th>
                  </tr>
                </thead>
                <tbody className={tbodyClass}>
                  {transactions.map((txn) => {
                    const products = txn.products ?? [];
                    const orderLabel = txn.orderPublicCode || (txn.orderId ? `#${txn.orderId}` : null);
                    return (
                      <React.Fragment key={txn.id}>
                        <tr>
                          <td className={tdClass}>
                            <Badge size="sm" color={typeColors[txn.type] ?? "light"}>
                              {typeLabels[txn.type] ?? txn.type}
                            </Badge>
                          </td>
                          <td className={`${tdClass} whitespace-nowrap tabular-nums`}>{formatDateTime(txn.createdAt)}</td>
                          <td className={`${tdClass} whitespace-nowrap text-right font-medium tabular-nums text-gray-800 dark:text-white/90`}>
                            {formatSignedCurrency(txn)}
                          </td>
                          <td className={tdClass}>{txn.description || "—"}</td>
                          <td className={tdClass}>{orderLabel ?? "—"}</td>
                        </tr>
                        {products.length > 0 && (
                          <tr className="bg-gray-50 dark:bg-white/[0.02]">
                            <td colSpan={5} className="px-4 py-2">
                              <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                {products.map((product, index) => (
                                  <li
                                    key={`${txn.id}-${product.productCode ?? index}-${index}`}
                                    className="flex flex-wrap items-baseline justify-between gap-x-4"
                                  >
                                    <span>
                                      <span className="text-gray-800 dark:text-white/90">
                                        {product.productName || product.name || "—"}
                                      </span>
                                      {[product.productCode, product.brand].filter(Boolean).length > 0 && (
                                        <span>{" "}({[product.productCode, product.brand].filter(Boolean).join(", ")})</span>
                                      )}
                                    </span>
                                    <span className="tabular-nums">
                                      {product.quantity} шт. × {formatKzt(product.price)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
};

function formatSignedCurrency(txn: TransactionDetail): string {
  const formatted = formatKzt(txn.amount);
  if (txn.type === "CHARGE") {
    return `−${formatted}`;
  }
  if (txn.type === "TOPUP" || txn.type === "REFUND" || txn.type === "RETURN") {
    return `+${formatted}`;
  }
  return formatted;
}

export default ViewBalanceModal;
