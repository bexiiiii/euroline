"use client";
import React, { useState, useEffect } from "react";
import Badge from "../ui/badge/Badge";
import Pagination from "../ui/pagination/Pagination";
import { financeApi, RefundRequest } from "@/lib/api/finance";
import { formatDateTime, formatKzt } from "@/lib/format";
import FinanceLoadError from "./FinanceLoadError";
import { RowAction, ViewIcon, rowClass, tableWrapClass, tbodyClass, tdClass, thClass, theadClass } from "./tableUi";

interface RefundHistoryTableProps {
  onViewRefund: (data: RefundRequest) => void;
  refreshKey?: number;
}

const RefundHistoryTable: React.FC<RefundHistoryTableProps> = ({
  onViewRefund,
  refreshKey = 0,
}) => {
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    loadRefundHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, refreshKey]);

  const loadRefundHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await financeApi.getRefundHistory(
        currentPage - 1,
        itemsPerPage
      );
      
      setRefunds(response.content ?? []);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error("Не удалось загрузить историю возвратов:", error);
      setRefunds([]);
      setError("Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): React.ComponentProps<typeof Badge>["color"] => {
    switch (status?.toUpperCase()) {
      case "DONE":
        return "success";
      case "REJECTED":
        return "error";
      case "APPROVED":
      case "IN_REVIEW":
        return "info";
      case "NEW":
        return "warning";
      default:
        return "light";
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toUpperCase()) {
      case "DONE":
        return "Выполнен";
      case "REJECTED":
        return "Отклонен";
      case "APPROVED":
        return "Одобрен";
      case "NEW":
        return "Новый";
      case "IN_REVIEW":
        return "На рассмотрении";
      default:
        return status || "—";
    }
  };

  const stateRow = (text: string) => (
    <tr>
      <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        {text}
      </td>
    </tr>
  );

  return (
    <div className="space-y-4">
      {error && <FinanceLoadError message={error} onRetry={loadRefundHistory} />}

      <div className={tableWrapClass}>
        <table className="w-full min-w-[720px]">
          <thead className={theadClass}>
            <tr>
              <th className={thClass}>Клиент</th>
              <th className={thClass}>Заказ</th>
              <th className={thClass}>Сумма</th>
              <th className={thClass}>Статус</th>
              <th className={thClass}>Создан</th>
              <th className={`${thClass} text-right`}>Действия</th>
            </tr>
          </thead>
          <tbody className={tbodyClass}>
            {loading
              ? stateRow("Загрузка…")
              : error
                ? stateRow("Данные недоступны")
                : refunds.length === 0
                  ? stateRow("Возвратов пока нет")
                  : refunds.map((refund) => (
                      <tr key={refund.id} className={rowClass}>
                        <td className={`${tdClass} font-medium text-gray-800 dark:text-white/90`}>
                          {refund.clientName || `Клиент #${refund.clientId ?? refund.userId ?? "—"}`}
                        </td>
                        <td className={tdClass}>{refund.orderId ? `#${refund.orderId}` : "—"}</td>
                        <td className={`${tdClass} font-medium tabular-nums text-gray-800 dark:text-white/90`}>
                          {formatKzt(refund.amount)}
                        </td>
                        <td className={tdClass}>
                          <Badge size="sm" color={getStatusColor(refund.status)}>
                            {getStatusText(refund.status)}
                          </Badge>
                        </td>
                        <td className={`${tdClass} whitespace-nowrap tabular-nums`}>{formatDateTime(refund.createdAt)}</td>
                        <td className={`${tdClass} text-right`}>
                          <RowAction label={`Просмотреть возврат #${refund.id}`} onClick={() => onViewRefund(refund)}>
                            <ViewIcon />
                          </RowAction>
                        </td>
                      </tr>
                    ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalElements}
          itemsPerPage={itemsPerPage}
        />
      )}
    </div>
  );
};

export default RefundHistoryTable;
