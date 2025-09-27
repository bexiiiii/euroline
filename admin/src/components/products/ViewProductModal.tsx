"use client";
import React from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";

interface Product {
  id: number;
  name: string;
  image: string;
  category: string;
  price: number;
  stock: number;
  status: "Активен" | "Неактивен" | "Нет в наличии";
  source: "1С" | "Ручной";
  createdAt: string;
  sku: string;
}

interface ViewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

const ViewProductModal: React.FC<ViewProductModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  if (!product) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Активен":
        return "success";
      case "Неактивен":
        return "warning";
      case "Нет в наличии":
        return "error";
      default:
        return "success";
    }
  };

  const getSourceBadgeColor = (source: string) => {
    return source === "1С" ? "primary" : "light";
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Информация о товаре
          </h4>
        </div>

        <div className="space-y-6">
          {/* Основная информация */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Изображение товара */}
            <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg h-48">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-gray-400"
              >
                <path
                  d="M21 16V8C21 6.89543 20.1046 6 19 6H5C3.89543 6 3 6.89543 3 8V16C3 17.1046 3.89543 18 5 18H19C20.1046 18 21 17.1046 21 16Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 12H17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Детали товара */}
            <div className="space-y-4">
              <div>
                <h5 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {product.name}
                </h5>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  SKU: {product.sku}
                </p>
              </div>

              <div className="flex gap-2">
                <Badge
                  size="sm"
                  color={getStatusColor(product.status) as "success" | "warning" | "error"}
                >
                  {product.status}
                </Badge>
                <Badge
                  size="sm"
                  color={getSourceBadgeColor(product.source) as "primary" | "light"}
                >
                  {product.source}
                </Badge>
              </div>
            </div>
          </div>

          {/* Подробная информация */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Категория
              </span>
              <p className="text-gray-900 dark:text-white">{product.category}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Цена
              </span>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatPrice(product.price)}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Количество на складе
              </span>
              <p className={`font-medium ${
                product.stock === 0 
                  ? 'text-red-600 dark:text-red-400' 
                  : product.stock < 10 
                  ? 'text-yellow-600 dark:text-yellow-400' 
                  : 'text-gray-900 dark:text-white'
              }`}>
                {product.stock} шт.
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Дата создания
              </span>
              <p className="text-gray-900 dark:text-white">
                {formatDate(product.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button size="sm" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ViewProductModal;
