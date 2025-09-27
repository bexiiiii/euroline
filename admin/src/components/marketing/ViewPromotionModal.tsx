"use client";
import React from "react";
import { Modal } from "../ui/modal";
import Badge from "../ui/badge/Badge";

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

interface ViewPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  promotionData: PromotionHistory | null;
}

const ViewPromotionModal: React.FC<ViewPromotionModalProps> = ({
  isOpen,
  onClose,
  promotionData,
}) => {
  if (!promotionData) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU');
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

  const getDiscountDescription = (type: string, value: number) => {
    switch (type) {
      case "percentage":
        return `Скидка ${value}% от стоимости товара`;
      case "fixed":
        return `Фиксированная скидка ${formatCurrency(value)}`;
      case "bogo":
        return "Акция 2 товара по цене 1";
      default:
        return "Неизвестный тип скидки";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
    >
      <div className="p-6">
        {/* Modal Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Детали акции
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Подробная информация о маркетинговой кампании
          </p>
        </div>

        <div className="space-y-6">
          {/* Promotion Info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Информация об акции
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">ID акции:</span>
                <span className="ml-2 text-sm text-gray-900 dark:text-white">
                  #{promotionData.id}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Название:</span>
                <span className="ml-2 text-sm text-gray-900 dark:text-white">
                  {promotionData.name}
                </span>
              </div>
              <div className="md:col-span-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Описание:</span>
                <span className="ml-2 text-sm text-gray-900 dark:text-white">
                  {promotionData.description}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Создана:</span>
                <span className="ml-2 text-sm text-gray-900 dark:text-white">
                  {formatDate(promotionData.createdDate)}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Автор:</span>
                <span className="ml-2 text-sm text-gray-900 dark:text-white">
                  {promotionData.createdBy}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Статус:</span>
                <span className="ml-2">
                  {getStatusBadge(promotionData.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Discount Details */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Условия акции
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Тип скидки:</span>
                  <span>
                    {getDiscountBadge(promotionData.discountType, promotionData.discountValue)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Описание:</span>
                  <span className="text-sm text-gray-900 dark:text-white text-right">
                    {getDiscountDescription(promotionData.discountType, promotionData.discountValue)}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Дата начала:</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {formatDate(promotionData.startDate)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Дата окончания:</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {formatDate(promotionData.endDate)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Результаты акции
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {promotionData.productsCount}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Товаров в акции
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {promotionData.ordersCount}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Заказов
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(promotionData.totalRevenue)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Выручка
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {promotionData.conversionRate}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Конверсия
                </div>
              </div>
            </div>
          </div>

          {/* Performance Analysis */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Анализ эффективности
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Средний чек:</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {promotionData.ordersCount > 0 
                    ? formatCurrency(promotionData.totalRevenue / promotionData.ordersCount)
                    : formatCurrency(0)
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Выручка на товар:</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {promotionData.productsCount > 0 
                    ? formatCurrency(promotionData.totalRevenue / promotionData.productsCount)
                    : formatCurrency(0)
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Эффективность:</span>
                <span className={`text-sm font-medium ${
                  promotionData.conversionRate > 10 
                    ? 'text-green-600 dark:text-green-400' 
                    : promotionData.conversionRate > 5
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {promotionData.conversionRate > 10 
                    ? 'Высокая' 
                    : promotionData.conversionRate > 5
                    ? 'Средняя'
                    : 'Низкая'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ViewPromotionModal;
