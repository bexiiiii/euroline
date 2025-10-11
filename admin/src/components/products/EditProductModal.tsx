"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import { Product } from "@/lib/api/products";

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSave: (productId: number, newStatus: string) => void;
}

const statusOptions = [
  { value: "active", label: "Активен" },
  { value: "inactive", label: "Неактивен" },
  { value: "out_of_stock", label: "Нет в наличии" },
];

function resolveInitialStatus(product: Product | null): string {
  if (!product) return statusOptions[0].value;
  if (product.stock === 0) return "out_of_stock";
  if (product.stock !== undefined && product.stock < 0) return "inactive";
  return "active";
}

const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  onClose,
  product,
  onSave,
}) => {
  const [selectedStatus, setSelectedStatus] = useState(resolveInitialStatus(product));

  useEffect(() => {
    setSelectedStatus(resolveInitialStatus(product));
  }, [product]);

  if (!product) {
    return null;
  }

  const handleSave = () => {
    onSave(product.id, selectedStatus);
    onClose();
  };

  const handleCancel = () => {
    setSelectedStatus(resolveInitialStatus(product));
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} className="max-w-xl p-6">
      <div className="space-y-6">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Редактирование товара</h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Управление статусом и доступностью каталога
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <h5 className="text-base font-medium text-gray-900 dark:text-white">{product.name}</h5>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Код: {product.code}</p>
          {product.externalCode && (
            <p className="text-sm text-gray-500 dark:text-gray-400">Внешний код: {product.externalCode}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Статус товара</Label>
          <select
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-700"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500 dark:bg-white/[0.03] dark:text-gray-400">
          <p className="mb-1">
            <strong className="text-gray-700 dark:text-gray-200">Активен:</strong> товар отображается
            в каталоге и доступен для заказа.
          </p>
          <p className="mb-1">
            <strong className="text-gray-700 dark:text-gray-200">Неактивен:</strong> товар скрыт из каталога,
            но остаётся в базе.
          </p>
          <p>
            <strong className="text-gray-700 dark:text-gray-200">Нет в наличии:</strong> товар отображается,
            но помечен как отсутствующий.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button size="sm" variant="outline" onClick={handleCancel}>
            Отмена
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={selectedStatus === resolveInitialStatus(product)}
          >
            Сохранить изменения
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditProductModal;
