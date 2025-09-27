"use client";
import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

import Badge from "../ui/badge/Badge";
import Image from "next/image";
import Pagination from "../ui/pagination/Pagination";
import ViewProductModal from "../products/ViewProductModal";
import EditProductModal from "../products/EditProductModal";
import { productApi, Product as ApiProduct } from "@/lib/api/products";

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
  code: string;
  brand: string;
}

export default function BasicTableOne() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Состояния для данных
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Состояния для модальных окон
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productApi.getProducts();
      
      // Маппим данные API в локальный тип
      const mappedProducts: Product[] = data.map((p: ApiProduct) => {
        const subcat = (p.properties || []).find(pp => pp.propertyName === 'subcategoryName')?.propertyValue;
        return {
        id: p.id,
        name: p.name,
        image: p.imageUrl || "",
        category: subcat || "Автозапчасти",
        price: p.price || 0,
        stock: p.stock || 0,
        status: (p.stock || 0) > 0 ? "Активен" : "Нет в наличии",
        source: p.syncedWith1C ? "1С" : "Ручной",
        createdAt: new Date().toISOString(), // TODO: добавить реальную дату создания в API
        sku: p.code,
        code: p.code,
        brand: p.brand,
      }});
      
      setProducts(mappedProducts);
    } catch (e: any) {
      setError(e.message || "Не удалось загрузить продукты");
    } finally {
      setLoading(false);
    }
  };

  const totalItems = products.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Get current page data
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return products.slice(startIndex, endIndex);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setViewModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setEditModalOpen(true);
  };

  const handleSaveProduct = (productId: number, newStatus: string) => {
    setProducts(prevProducts =>
      prevProducts.map(product =>
        product.id === productId
          ? { ...product, status: newStatus as "Активен" | "Неактивен" | "Нет в наличии" }
          : product
      )
    );
  };

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
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[1200px]">
          <Table>
            {/* Table Header */}
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Товар
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Категория
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Цена
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Запас
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Статус
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Источник
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Создан
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Действия
                </TableCell>
              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {loading ? (
                <TableRow>
                  <TableCell className="px-5 py-4 text-center" colSpan={8}>
                    Загрузка продуктов...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell className="px-5 py-4 text-center text-red-600" colSpan={8}>
                    Ошибка: {error}
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell className="px-5 py-4 text-center" colSpan={8}>
                    Нет продуктов
                  </TableCell>
                </TableRow>
              ) : (
                getCurrentPageData().map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <svg
                              width="24"
                              height="24"
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
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90 truncate">
                            {product.name}
                          </span>
                          <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                            SKU: {product.sku}
                          </span>
                          {product.brand && (
                            <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                              {product.brand}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-700 text-start text-theme-sm dark:text-gray-300">
                      {product.category}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-700 text-start text-theme-sm dark:text-gray-300 font-medium">
                      {product.price > 0 ? formatPrice(product.price) : "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start text-theme-sm">
                      <span className={`font-medium ${
                        product.stock === 0 
                          ? 'text-red-600 dark:text-red-400' 
                          : product.stock < 10 
                          ? 'text-yellow-600 dark:text-yellow-400' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {product.stock} шт.
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start text-theme-sm">
                      <Badge
                        size="sm"
                        color={getStatusColor(product.status) as "success" | "warning" | "error"}
                      >
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start text-theme-sm">
                      <Badge
                        size="sm"
                        color={getSourceBadgeColor(product.source) as "primary" | "light"}
                      >
                        {product.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {formatDate(product.createdAt)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewProduct(product)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                          title="Просмотр"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <circle
                              cx="12"
                              cy="12"
                              r="3"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors dark:hover:bg-green-900/20 dark:hover:text-green-400"
                          title="Редактировать статус"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
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
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
      />

      {/* Модальные окна */}
      <ViewProductModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        product={selectedProduct}
      />

      <EditProductModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        product={selectedProduct}
        onSave={handleSaveProduct}
      />
    </div>
  );
}
