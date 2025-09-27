"use client";
import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table/index";
import Badge from "../ui/badge/Badge";
import Pagination from "../ui/pagination/Pagination";
import { cartsApi, CustomerCart } from "@/lib/api/carts";

interface AbandonedCartsTableProps {
  onViewCart?: (cartId: number) => void;
  onSendReminder?: (cartId: number) => void;
  onClearCart?: (cartId: number) => void;
  onConvertToOrder?: (cartId: number) => void;
  refreshTrigger?: number;
}

const AbandonedCartsTable: React.FC<AbandonedCartsTableProps> = ({
  onViewCart,
  onSendReminder,
  onClearCart,
  onConvertToOrder,
  refreshTrigger = 0,
}) => {
  const [carts, setCarts] = useState<CustomerCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'ABANDONED' | ''>('ABANDONED');

  const itemsPerPage = 10;

  useEffect(() => {
    loadCarts();
  }, [currentPage, statusFilter, refreshTrigger]);

  const loadCarts = async () => {
    try {
      setLoading(true);
      const response = await cartsApi.getCarts(
        currentPage - 1,
        itemsPerPage,
        'lastUpdated,desc',
        statusFilter || undefined
      );
      
      setCarts(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error("Ошибка при загрузке корзин:", error);
      setCarts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (searchTerm.trim()) {
      // TODO: Реализовать поиск по имени клиента или email
      await loadCarts();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
    }).format(amount);
  };

  const getStatusColor = (isAbandoned: boolean): "success" | "warning" | "error" => {
    return isAbandoned ? "error" : "success";
  };

  const getStatusText = (isAbandoned: boolean): string => {
    return isAbandoned ? "Брошенная" : "Активная";
  };

  const getDaysSinceLastActivity = (lastUpdated: string): number => {
    const now = new Date();
    const updatedDate = new Date(lastUpdated);
    const diffTime = Math.abs(now.getTime() - updatedDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Загрузка корзин...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Фильтры и поиск */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Поиск по имени клиента или email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ACTIVE' | 'ABANDONED' | '')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Все корзины</option>
            <option value="ACTIVE">Активные</option>
            <option value="ABANDONED">Брошенные</option>
          </select>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Поиск
          </button>
        </div>
      </div>

      {/* Таблица корзин */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID Корзины
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Клиент
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Товары
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Сумма
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Последняя активность
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Дней назад
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {carts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  Корзины не найдены
                </TableCell>
              </TableRow>
            ) : (
              carts.map((cart) => (
                <TableRow key={cart.id} className="hover:bg-gray-50">
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{cart.id}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {cart.customerName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {cart.customerEmail}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cart.totalItems} товар(ов)
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(cart.totalAmount)}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <Badge 
                      color={getStatusColor(cart.isAbandoned)}
                      variant="light"
                    >
                      {getStatusText(cart.isAbandoned)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(cart.lastUpdated)}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getDaysSinceLastActivity(cart.lastUpdated)} дн.
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onViewCart?.(cart.id)}
                        className="text-blue-600 hover:text-blue-900 px-2 py-1 text-xs bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                      >
                        Просмотр
                      </button>
                      {cart.isAbandoned && (
                        <button
                          onClick={() => onSendReminder?.(cart.id)}
                          className="text-yellow-600 hover:text-yellow-900 px-2 py-1 text-xs bg-yellow-100 rounded hover:bg-yellow-200 transition-colors"
                        >
                          Напоминание
                        </button>
                      )}
                      <button
                        onClick={() => onConvertToOrder?.(cart.id)}
                        className="text-green-600 hover:text-green-900 px-2 py-1 text-xs bg-green-100 rounded hover:bg-green-200 transition-colors"
                      >
                        В заказ
                      </button>
                      <button
                        onClick={() => onClearCart?.(cart.id)}
                        className="text-red-600 hover:text-red-900 px-2 py-1 text-xs bg-red-100 rounded hover:bg-red-200 transition-colors"
                      >
                        Очистить
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalElements}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default AbandonedCartsTable;
