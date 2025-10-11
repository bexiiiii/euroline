"use client";

import React from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";
import { Product } from "@/lib/api/products";

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
  if (!product) {
    return null;
  }

  const formatPrice = (price?: number) => {
    if (price === undefined || Number.isNaN(price)) {
      return "—";
    }
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (value?: string) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("ru-RU");
  };

  const statusMeta = (() => {
    if (product.stock === undefined) {
      return product.syncedWith1C
        ? { label: "Синхронизирован", color: "primary" as const }
        : { label: "Черновик", color: "light" as const };
    }
    if (product.stock === 0) {
      return { label: "Нет в наличии", color: "error" as const };
    }
    if (product.stock < 10) {
      return { label: "Малый остаток", color: "warning" as const };
    }
    return { label: "В наличии", color: "success" as const };
  })();

  const sourceMeta = product.syncedWith1C
    ? { label: "1С", color: "primary" as const }
    : { label: "Ручной", color: "light" as const };

  const properties = product.properties ?? [];
  const categoryLabel = product.brand || "—";

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xl font-semibold text-gray-900 dark:text-white">Информация о товаре</h4>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 h-48">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-gray-400"
                >
                  <rect
                    x="3"
                    y="6"
                    width="18"
                    height="12"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M7 12H17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h5 className="text-lg font-medium text-gray-900 dark:text-white">{product.name}</h5>
                <p className="text-sm text-gray-500 dark:text-gray-400">Код: {product.code}</p>
                {product.externalCode && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Внешний код: {product.externalCode}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge size="sm" color={statusMeta.color}>{statusMeta.label}</Badge>
                <Badge size="sm" color={sourceMeta.color}>{sourceMeta.label}</Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900/40 rounded-lg">
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Бренд</span>
              <p className="text-gray-900 dark:text-white">{categoryLabel}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Цена</span>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatPrice(product.price)}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Остаток</span>
              <p className="text-gray-900 dark:text-white">
                {product.stock !== undefined ? `${product.stock} шт.` : "—"}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Синхронизация</span>
              <p className="text-gray-900 dark:text-white">{product.syncedWith1C ? "Да" : "Нет"}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Обновлено</span>
              <p className="text-gray-900 dark:text-white">{formatDate(product.weeklyEndAt)}</p>
            </div>
          </div>

          {properties.length > 0 && (
            <div className="space-y-3">
              <h6 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Характеристики</h6>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {properties.map((property) => (
                  <div
                    key={`${property.propertyName}-${property.propertyValue}`}
                    className="rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-white/[0.02]"
                  >
                    <p className="text-gray-500 dark:text-gray-400">{property.propertyName}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{property.propertyValue}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ViewProductModal;
