"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import Pagination from "../ui/pagination/Pagination";
import ViewProductModal from "../products/ViewProductModal";
import EditProductModal from "../products/EditProductModal";
import { productApi, Product as ApiProduct } from "@/lib/api/products";

type UiStatus = "Активен" | "Неактивен" | "Нет в наличии";
type UiSource = "1С" | "Ручной";

type UiProduct = ApiProduct & {
  uiCategory: string;
  uiStatus: UiStatus;
  uiSource: UiSource;
  uiCreatedAt: string;
};

const statusByValue: Record<string, UiStatus> = {
  active: "Активен",
  inactive: "Неактивен",
  out_of_stock: "Нет в наличии",
};

const mapProductToUi = (product: ApiProduct): UiProduct => {
  const subcategory = product.properties?.find(
    (prop) => prop.propertyName === "subcategoryName"
  )?.propertyValue;

  const stock = product.stock ?? 0;
  const uiStatus: UiStatus = stock <= 0 ? "Нет в наличии" : "Активен";
  const uiSource: UiSource = product.syncedWith1C ? "1С" : "Ручной";

  return {
    ...product,
    uiCategory: subcategory || product.brand || "Автозапчасти",
    uiStatus,
    uiSource,
    uiCreatedAt: product.weeklyStartAt || product.weeklyEndAt || new Date().toISOString(),
  };
};

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

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleDateString("ru-RU");
};

type BadgeColor = React.ComponentProps<typeof Badge>["color"];

const statusBadgeColor = (status: UiStatus): BadgeColor => {
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

const sourceBadgeColor = (source: UiSource): BadgeColor =>
  source === "1С" ? "primary" : "light";

export default function BasicTableOne() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [products, setProducts] = useState<UiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<UiProduct | null>(null);

  useEffect(() => {
    void loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productApi.getProducts();
      setProducts(data.map(mapProductToUi));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Не удалось загрузить продукты";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const totalItems = products.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const currentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return products.slice(startIndex, startIndex + itemsPerPage);
  };

  const handleViewProduct = (product: UiProduct) => {
    setSelectedProduct(product);
    setViewModalOpen(true);
  };

  const handleEditProduct = (product: UiProduct) => {
    setSelectedProduct(product);
    setEditModalOpen(true);
  };

  const handleSaveProduct = (productId: number, newStatus: string) => {
    const nextStatus = statusByValue[newStatus] ?? "Активен";
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId ? { ...product, uiStatus: nextStatus } : product
      )
    );
  };

  const renderTableBody = () => {
    if (loading) {
      return (
        <TableRow>
          <TableCell className="px-5 py-4 text-center" colSpan={8}>
            Загрузка продуктов...
          </TableCell>
        </TableRow>
      );
    }

    if (error) {
      return (
        <TableRow>
          <TableCell className="px-5 py-4 text-center text-red-600" colSpan={8}>
            Ошибка: {error}
          </TableCell>
        </TableRow>
      );
    }

    const pageData = currentPageData();
    if (pageData.length === 0) {
      return (
        <TableRow>
          <TableCell className="px-5 py-4 text-center" colSpan={8}>
            Продукты не найдены
          </TableCell>
        </TableRow>
      );
    }

    return pageData.map((product) => (
      <TableRow key={product.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.05]">
        <TableCell className="px-5 py-4 lg:px-7">
          <div className="flex items-center gap-4">
            <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  priority
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                  Нет фото
                </div>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Артикул: {product.code}</p>
            </div>
          </div>
        </TableCell>
        <TableCell className="px-5 py-4 lg:px-7">{product.uiCategory}</TableCell>
        <TableCell className="px-5 py-4 lg:px-7 font-medium text-gray-700 dark:text-gray-200">
          {product.price ? formatPrice(product.price) : "—"}
        </TableCell>
        <TableCell className="px-5 py-4 lg:px-7">
          <span
            className={`font-medium ${
              product.stock === undefined
                ? "text-gray-700 dark:text-gray-300"
                : product.stock === 0
                ? "text-red-600 dark:text-red-400"
                : product.stock < 10
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-gray-700 dark:text-gray-300"
            }`}
          >
            {product.stock !== undefined ? `${product.stock} шт.` : "—"}
          </span>
        </TableCell>
        <TableCell className="px-5 py-4 lg:px-7">
          <Badge color={statusBadgeColor(product.uiStatus)} variant="light">
            {product.uiStatus}
          </Badge>
        </TableCell>
        <TableCell className="px-5 py-4 lg:px-7">
          <Badge color={sourceBadgeColor(product.uiSource)} variant="light">
            {product.uiSource}
          </Badge>
        </TableCell>
        <TableCell className="px-5 py-4 lg:px-7 text-gray-500 dark:text-gray-400">
          {formatDate(product.uiCreatedAt)}
        </TableCell>
        <TableCell className="px-5 py-4 lg:px-7 text-end">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => handleViewProduct(product)}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
              title="Просмотр"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
            <button
              onClick={() => handleEditProduct(product)}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400"
              title="Редактировать статус"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[1200px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Товар
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Категория
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Цена
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Запас
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Статус
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Источник
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Обновлено
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Действия
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {renderTableBody()}
            </TableBody>
          </Table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
      />

      <ViewProductModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        product={selectedProduct}
      />

      <EditProductModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleSaveProduct}
        product={selectedProduct}
      />
    </div>
  );
}
