"use client";

import React from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";
import { Product } from "@/lib/api/products";
import { formatKzt } from "@/lib/format";

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
    return formatKzt(price);
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

  const sourceLabel = product.syncedWith1C ? "1С" : "Вручную";

  const allProperties = product.properties ?? [];
  const subcategoryName = allProperties.find((p) => p.propertyName === "subcategoryName")?.propertyValue;
  const properties = allProperties.filter((p) => !p.propertyName.startsWith("subcategory"));

  const fields: { label: string; value: React.ReactNode }[] = [
    { label: "Бренд", value: product.brand || "—" },
    { label: "Цена", value: <span className="font-semibold tabular-nums">{formatPrice(product.price)}</span> },
    { label: "Остаток", value: product.stock !== undefined ? `${product.stock} шт.` : "—" },
    { label: "Источник", value: sourceLabel },
  ];
  if (subcategoryName) fields.push({ label: "Подкатегория", value: subcategoryName });
  if (product.weekly) fields.push({ label: "Товар недели до", value: formatDate(product.weeklyEndAt) });

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-5">
        <h4 className="mb-4 pr-10 text-lg font-semibold text-gray-800 dark:text-white/90">Товар</h4>

        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-white/[0.05]">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.imageUrl} alt={product.name} className="h-full w-full object-contain" />
              ) : (
                <svg className="size-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              )}
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-base font-semibold text-gray-800 dark:text-white/90">{product.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Код: {product.code}
                {product.externalCode && product.externalCode !== product.code ? ` · Внешний код: ${product.externalCode}` : ""}
              </p>
              <Badge size="sm" variant="light" color={statusMeta.color}>{statusMeta.label}</Badge>
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.label}>
                <dt className="text-xs text-gray-500 dark:text-gray-400">{f.label}</dt>
                <dd className="text-sm text-gray-800 dark:text-white/90">{f.value}</dd>
              </div>
            ))}
          </dl>

          {properties.length > 0 && (
            <div className="space-y-2">
              <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300">Характеристики</h6>
              <dl className="divide-y divide-gray-100 rounded-lg border border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
                {properties.map((property) => (
                  <div
                    key={`${property.propertyName}-${property.propertyValue}`}
                    className="flex justify-between gap-4 px-3 py-2"
                  >
                    <dt className="text-gray-500 dark:text-gray-400">{property.propertyName}</dt>
                    <dd className="text-right font-medium text-gray-800 dark:text-white/90">{property.propertyValue}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <Button size="sm" variant="outline" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ViewProductModal;
