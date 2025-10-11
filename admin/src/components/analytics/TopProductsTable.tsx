"use client";
import React, { useEffect, useState } from "react";
import { analyticsApi, TopProductDetail } from "@/lib/api/analytics";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";

export default function TopProductsTable() {
  const [products, setProducts] = useState<TopProductDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const result = await analyticsApi.getTopProductsDetailed(10);
        setProducts(result);
      } catch (error) {
        console.error("Failed to fetch top products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded dark:bg-gray-800 mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded dark:bg-gray-800"></div>
          ))}
        </div>
      </div>
    );
  }

  // Генерируем случайные данные для демонстрации
  const topProductsData = products.map((product, index) => ({
    rank: index + 1,
    id: product.id,
    name: product.name,
    category: product.category,
    sales: product.sales,
    revenue: product.revenue,
    trend: product.trend,
  }));

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Топ продаж
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Самые продаваемые товары
          </p>
        </div>
        <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5">
          Смотреть все
        </button>
      </div>

      {topProductsData.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  #
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Товар
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Продажи
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Выручка
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Рост
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {topProductsData.map((product) => (
                <TableRow key={product.rank}>
                  <TableCell className="py-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {product.rank}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <p className="font-medium text-gray-800 dark:text-white/90">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {product.category}
                    </p>
                  </TableCell>
                  <TableCell className="py-4 text-gray-600 dark:text-gray-400">
                    {product.sales.toLocaleString()}
                  </TableCell>
                  <TableCell className="py-4 text-gray-600 dark:text-gray-400">
                    {product.revenue.toLocaleString()} ₸
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge color={product.trend === "up" ? "success" : "error"} size="sm">
                      {product.trend === "up" ? "↑" : "↓"} {product.trend === "up" ? "Рост" : "Спад"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
          Нет данных о продажах
        </div>
      )}
    </div>
  );
}
