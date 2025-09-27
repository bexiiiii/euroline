"use client";
import React, { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import Pagination from "../ui/pagination/Pagination";
import { apiFetch } from "@/lib/api";

interface ReturnsTableProps {
  onViewReturn: (returnData: Return) => void;
  onProcessReturn: (returnData: Return) => void;
}

interface Return {
  id: number;
  returnNumber: string;
  originalOrderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  totalRefund: number;
  status: "Запрос на возврат" | "В обработке" | "Одобрен" | "Отклонен" | "Возврат завершен";
  returnType: "Полный возврат" | "Частичный возврат" | "Обмен";
  requestDate: string;
  reason: string;
}

const ReturnsTable: React.FC<ReturnsTableProps> = ({ onViewReturn, onProcessReturn }) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [data, setData] = React.useState<Return[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const page = await apiFetch<{ content: any[] }>(`/api/returns?page=${currentPage-1}&size=10`);
        const mapped: Return[] = page.content.map((r) => ({
          id: r.id,
          returnNumber: `RET-${r.id.toString().padStart(6, '0')}`,
          originalOrderNumber: r.orderId ? `ORD-${r.orderId}` : "-",
          customer: { name: r.customerId ? `ID ${r.customerId}` : "-", email: "", phone: "" },
          totalRefund: 0,
          status: r.status === 'NEW' ? 'Запрос на возврат' : r.status === 'PROCESSED' ? 'В обработке' : r.status === 'APPROVED' ? 'Одобрен' : r.status === 'REJECTED' ? 'Отклонен' : 'Возврат завершен',
          returnType: "Частичный возврат",
          requestDate: r.createdAt,
          reason: r.reason || "",
        }));
        setData(mapped);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentPage]);

  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil((data?.length || 0) / itemsPerPage));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Запрос на возврат":
        return "warning";
      case "В обработке":
        return "info";
      case "Одобрен":
        return "success";
      case "Отклонен":
        return "error";
      case "Возврат завершен":
        return "dark";
      default:
        return "light";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Полный возврат":
        return "primary";
      case "Частичный возврат":
        return "info";
      case "Обмен":
        return "success";
      default:
        return "light";
    }
  };

  // Calculate pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-gray-800">
            <TableRow>
              <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Возврат
              </TableCell>
              <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Клиент
              </TableCell>
              <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Сумма возврата
              </TableCell>
              <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Статус
              </TableCell>
              <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Тип
              </TableCell>
              <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Дата запроса
              </TableCell>
              <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Действия
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
            {currentData.map((returnItem) => (
              <TableRow key={returnItem.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {returnItem.returnNumber}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Заказ: {returnItem.originalOrderNumber}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {returnItem.customer.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {returnItem.customer.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {returnItem.status === "Отклонен" ? "—" : formatCurrency(returnItem.totalRefund)}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  <Badge
                    size="sm"
                    color={getStatusColor(returnItem.status) as any}
                  >
                    {returnItem.status}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  <Badge
                    size="sm"
                    color={getTypeColor(returnItem.returnType) as any}
                  >
                    {returnItem.returnType}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatDate(returnItem.requestDate)}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onViewReturn(returnItem)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                      title="Просмотр"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    {(returnItem.status === "Запрос на возврат" || returnItem.status === "В обработке") && (
                      <button
                        onClick={() => onProcessReturn(returnItem)}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                        title="Обработать"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={data.length}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
};

export default ReturnsTable;
