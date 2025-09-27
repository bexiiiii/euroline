"use client";
import React, { useState } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Label from "../form/Label";

interface Product {
  id: number;
  name: string;
  status: "Активен" | "Неактивен" | "Нет в наличии";
  sku: string;
}

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSave: (productId: number, newStatus: string) => void;
}

const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  onClose,
  product,
  onSave,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>(
    product?.status || "Активен"
  );

  React.useEffect(() => {
    if (product) {
      setSelectedStatus(product.status);
    }
  }, [product]);

  const handleSave = () => {
    if (product) {
      onSave(product.id, selectedStatus);
      onClose();
    }
  };

  const handleClose = () => {
    if (product) {
      setSelectedStatus(product.status);
    }
    onClose();
  };

  if (!product) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[500px] p-6">
      <div>
        <h4 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
          Редактирование товара
        </h4>

        <div className="space-y-4">
          {/* Информация о товаре */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h5 className="font-medium text-gray-900 dark:text-white mb-2">
              {product.name}
            </h5>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              SKU: {product.sku}
            </p>
          </div>

          {/* Изменение статуса */}
          <div>
            <Label>Статус товара</Label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            >
              <option value="Активен">Активен</option>
              <option value="Неактивен">Неактивен</option>
              <option value="Нет в наличии">Нет в наличии</option>
            </select>
          </div>

          {/* Описание статусов */}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p className="mb-1">
              <strong>Активен:</strong> Товар доступен для продажи
            </p>
            <p className="mb-1">
              <strong>Неактивен:</strong> Товар временно недоступен
            </p>
            <p>
              <strong>Нет в наличии:</strong> Товар закончился на складе
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <Button size="sm" variant="outline" onClick={handleClose}>
            Отмена
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={selectedStatus === product.status}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Сохранить изменения
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditProductModal;
