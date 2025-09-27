"use client";
import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import Pagination from "../ui/pagination/Pagination";
import { financeApi, RefundRequest } from "@/lib/api/finance";

interface RefundHistoryTableProps {
  onViewRefund: (data: RefundRequest) => void;
}

const RefundHistoryTable: React.FC<RefundHistoryTableProps> = ({
  onViewRefund,
}) => {
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    loadRefundHistory();
  }, [currentPage]);

  const loadRefundHistory = async () => {
    try {
      setLoading(true);
      const response = await financeApi.getRefundHistory(
        currentPage - 1,
        itemsPerPage
      );
      
      setRefunds(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error("Не удалось загрузить историю возвратов:", error);
      setRefunds([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "DONE":
        return "success";
      case "REJECTED":
        return "error";
      case "APPROVED":
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
      default:
        return status;
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Загрузка...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-gray-800">
            <TableRow>
              <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Клиент
              </TableCell>
              <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Заказ
              </TableCell>
              <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Сумма возврата
              </TableCell>
              <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Статус
              </TableCell>
              <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Дата создания
              </TableCell>
              <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Действия
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
            {refunds.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  История возвратов не найдена
                </TableCell>
              </TableRow>
            ) : (
              refunds.map((refund) => (
                <TableRow key={refund.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        ID клиента: {refund.clientId}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        Заказ: {refund.orderId}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(refund.amount)}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      size="sm"
                      color={getStatusColor(refund.status) as any}
                    >
                      {getStatusText(refund.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatDate(refund.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => onViewRefund(refund)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                      title="Просмотр"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
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
