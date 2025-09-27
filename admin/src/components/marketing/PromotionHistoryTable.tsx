"use client";
import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Pagination from "@/components/ui/pagination/Pagination";

interface PromotionHistory {
  id: number;
  name: string;
  description: string;
  discountType: "percentage" | "fixed" | "bogo";
  discountValue: number;
  startDate: string;
  endDate: string;
  status: "completed" | "cancelled" | "expired";
  productsCount: number;
  ordersCount: number;
  totalRevenue: number;
  conversionRate: number;
  createdBy: string;
  createdDate: string;
}

interface PromotionHistoryTableProps {
  onViewPromotion: (data: PromotionHistory) => void;
  onClonePromotion: (data: PromotionHistory) => void;
}

// Mock данные истории акций
const mockPromotionHistory: PromotionHistory[] = [
  {
    id: 1,
    name: "Черная пятница 2023",
    description: "Скидки до 50% на все автозапчасти",
    discountType: "percentage",
    discountValue: 50,
    startDate: "2023-11-24T00:00:00Z",
    endDate: "2023-11-26T23:59:59Z",
    status: "completed",
    productsCount: 150,
    ordersCount: 287,
    totalRevenue: 1250000,
    conversionRate: 15.8,
    createdBy: "Иван Петров",
    createdDate: "2023-11-01T10:00:00Z"
  },
  {
    id: 2,
    name: "Новогодняя распродажа",
    description: "Скидка 1000₽ при покупке от 5000₽",
    discountType: "fixed",
    discountValue: 1000,
    startDate: "2023-12-20T00:00:00Z",
    endDate: "2024-01-10T23:59:59Z",
    status: "completed",
    productsCount: 200,
    ordersCount: 156,
    totalRevenue: 980000,
    conversionRate: 12.3,
    createdBy: "Мария Сидорова",
    createdDate: "2023-12-01T14:30:00Z"
  },
  {
    id: 3,
    name: "Весенние скидки",
    description: "Скидка 20% на масла и фильтры",
    discountType: "percentage",
    discountValue: 20,
    startDate: "2024-03-01T00:00:00Z",
    endDate: "2024-03-31T23:59:59Z",
    status: "completed",
    productsCount: 85,
    ordersCount: 94,
    totalRevenue: 456000,
    conversionRate: 8.7,
    createdBy: "Алексей Козлов",
    createdDate: "2024-02-15T09:15:00Z"
  },
  {
    id: 4,
    name: "Летняя акция",
    description: "2 товара по цене 1",
    discountType: "bogo",
    discountValue: 50,
    startDate: "2024-06-01T00:00:00Z",
    endDate: "2024-06-30T23:59:59Z",
    status: "cancelled",
    productsCount: 120,
    ordersCount: 23,
    totalRevenue: 89000,
    conversionRate: 2.1,
    createdBy: "Елена Васильева",
    createdDate: "2024-05-20T16:45:00Z"
  },
  {
    id: 5,
    name: "День автомобилиста",
    description: "Скидка 15% для всех автовладельцев",
    discountType: "percentage",
    discountValue: 15,
    startDate: "2024-10-25T00:00:00Z",
    endDate: "2024-10-27T23:59:59Z",
    status: "expired",
    productsCount: 180,
    ordersCount: 145,
    totalRevenue: 678000,
    conversionRate: 11.2,
    createdBy: "Дмитрий Морозов",
    createdDate: "2024-10-01T12:00:00Z"
  }
];

const PromotionHistoryTable: React.FC<PromotionHistoryTableProps> = ({
  onViewPromotion,
  onClonePromotion,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const itemsPerPage = 10;

  // Фильтрация данных
  const filteredData = mockPromotionHistory.filter((promotion) => {
    const matchesSearch = 
      promotion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promotion.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promotion.createdBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || promotion.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Пагинация
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="light" color="success">Завершена</Badge>;
      case "cancelled":
        return <Badge variant="light" color="error">Отменена</Badge>;
      case "expired":
        return <Badge variant="light" color="warning">Истекла</Badge>;
      default:
        return <Badge variant="light" color="light">{status}</Badge>;
    }
  };

  const getDiscountBadge = (type: string, value: number) => {
    switch (type) {
      case "percentage":
        return <Badge variant="light" color="info">{value}%</Badge>;
      case "fixed":
        return <Badge variant="light" color="primary">{formatCurrency(value)}</Badge>;
      case "bogo":
        return <Badge variant="light" color="warning">2 за 1</Badge>;
      default:
        return <Badge variant="light" color="light">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Фильтры и поиск */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Поиск по названию, описанию или автору..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div className="sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">Все статусы</option>
            <option value="completed">Завершенные</option>
            <option value="cancelled">Отмененные</option>
            <option value="expired">Истекшие</option>
          </select>
        </div>
      </div>

      {/* Таблица */}
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">Акция</th>
              <th className="px-4 py-3 text-center font-medium text-gray-900 dark:text-white">Скидка</th>
              <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">Период</th>
              <th className="px-4 py-3 text-center font-medium text-gray-900 dark:text-white">Статус</th>
              <th className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">Результаты</th>
              <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">Автор</th>
              <th className="px-4 py-3 text-center font-medium text-gray-900 dark:text-white">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.map((promotion) => (
              <tr key={promotion.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {promotion.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {promotion.description}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {promotion.productsCount} товаров
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  {getDiscountBadge(promotion.discountType, promotion.discountValue)}
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Создана {formatDate(promotion.createdDate)}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  {getStatusBadge(promotion.status)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="space-y-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(promotion.totalRevenue)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {promotion.ordersCount} заказов
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400">
                      {promotion.conversionRate}% конверсия
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {promotion.createdBy}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewPromotion(promotion)}
                    >
                      Подробнее
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onClonePromotion(promotion)}
                    >
                      Копировать
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {paginatedData.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Нет данных для отображения
          </div>
        )}
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredData.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      )}
    </div>
  );
};

export default PromotionHistoryTable;
