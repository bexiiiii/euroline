"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { analyticsApi, TopProductDetail } from "@/lib/api/analytics";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import { formatKzt } from "@/lib/format";
import WidgetError from "./WidgetError";

export default function TopProductsTable() {
  const [products, setProducts] = useState<TopProductDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyticsApi.getTopProductsDetailed(10);
      setProducts(result ?? []);
    } catch (err) {
      console.error("Failed to fetch top products:", err);
      setError("Не удалось загрузить топ продаж");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] animate-pulse">
        <div className="mb-4 h-5 w-40 rounded bg-gray-200 dark:bg-gray-800"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded dark:bg-gray-800"></div>
          ))}
        </div>
      </div>
    );
  }

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
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
          Топ продаж
        </h3>
        <Button asChild size="xs" variant="outline">
          <Link href="/products">Все товары</Link>
        </Button>
      </div>

      {error ? (
        <WidgetError message="Не удалось загрузить данные" onRetry={fetchProducts} />
      ) : topProductsData.length > 0 ? (
        <div className="-mx-4 overflow-x-auto">
          <Table>
            <TableHeader className="border-y border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  #
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  Товар
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  Продажи
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  Выручка
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  Рост
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {topProductsData.map((product) => (
                <TableRow key={product.id ?? product.rank}>
                  <TableCell className="px-4 py-3 text-sm tabular-nums text-gray-500 dark:text-gray-400">
                    {product.rank}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    <p className="font-medium text-gray-800 dark:text-white/90">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {product.category}
                    </p>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm tabular-nums text-gray-700 dark:text-gray-300">
                    {Number(product.sales ?? 0).toLocaleString("ru-RU")}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm tabular-nums text-gray-700 dark:text-gray-300">
                    {formatKzt(product.revenue)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {product.trend === "up" || product.trend === "down" ? (
                      <Badge variant="light" color={product.trend === "up" ? "success" : "error"} size="sm">
                        {product.trend === "up" ? "Рост" : "Спад"}
                      </Badge>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
          Продаж пока нет
        </div>
      )}
    </div>
  );
}
