"use client";
import React from "react";
import { Modal } from "../ui/modal";
import Badge from "../ui/badge/Badge";

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

interface ViewReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  returnData: Return | null;
}

const ViewReturnModal: React.FC<ViewReturnModalProps> = ({
  isOpen,
  onClose,
  returnData,
}) => {
  if (!returnData) return null;

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
            Детали возврата
          </h2>
        </div>

        <div className="space-y-6">
        {/* Header Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {returnData.returnNumber}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Оригинальный заказ: {returnData.originalOrderNumber}
            </p>
          </div>
          <div className="flex flex-col space-y-2">
            <Badge
              size="sm"
              color={getStatusColor(returnData.status) as any}
            >
              {returnData.status}
            </Badge>
            <Badge
              size="sm"
              color={getTypeColor(returnData.returnType) as any}
            >
              {returnData.returnType}
            </Badge>
          </div>
        </div>

        {/* Customer Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white">
            Информация о клиенте
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Имя:</span>
              <span className="ml-2 text-sm text-gray-900 dark:text-white">
                {returnData.customer.name}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Email:</span>
              <span className="ml-2 text-sm text-gray-900 dark:text-white">
                {returnData.customer.email}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Телефон:</span>
              <span className="ml-2 text-sm text-gray-900 dark:text-white">
                {returnData.customer.phone}
              </span>
            </div>
          </div>
        </div>

        {/* Return Details */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white">
            Детали возврата
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Дата запроса:</span>
              <span className="ml-2 text-sm text-gray-900 dark:text-white">
                {formatDate(returnData.requestDate)}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Сумма возврата:</span>
              <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                {returnData.status === "Отклонен" ? "—" : formatCurrency(returnData.totalRefund)}
              </span>
            </div>
            <div className="md:col-span-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Причина возврата:</span>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {returnData.reason}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
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

export default ViewReturnModal;
