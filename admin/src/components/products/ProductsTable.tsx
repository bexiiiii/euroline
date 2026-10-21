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
import Pagination from "../ui/pagination/Pagination";
import { productApi, Product } from "@/lib/api/products";
import { formatKzt } from "@/lib/format";
import { useToast } from "@/context/ToastContext";

const TH = "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400";
const TD = "px-4 py-3 text-sm text-gray-700 dark:text-gray-300";
const ICON_BTN =
  "inline-flex size-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-gray-200";
const ICON_BTN_DANGER =
  "inline-flex size-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-error-50 hover:text-error-600 dark:text-gray-400 dark:hover:bg-error-500/15 dark:hover:text-error-500";

interface ProductsTableProps {
  refreshKey: number;
  onViewProduct?: (product: Product) => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (product: Product) => void;
}

/** Миниатюра товара: при отсутствии или ошибке загрузки показываем заглушку. */
const ProductThumb: React.FC<{ src?: string | null }> = ({ src }) => {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        onError={() => setFailed(true)}
        className="size-10 shrink-0 rounded-lg object-cover"
      />
    );
  }
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-white/[0.05]">
      <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    </div>
  );
};

const ProductsTable: React.FC<ProductsTableProps> = ({
  refreshKey,
  onViewProduct,
  onEditProduct,
  onDeleteProduct
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { error: showError } = useToast();
  
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [refreshKey]);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, refreshKey]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await productApi.getProducts(currentPage - 1, itemsPerPage);
      
      setProducts(response.content);
      setTotalElements(response.totalElements);
      setTotalPages(response.totalPages);
    } catch (e: any) {
      setError(e?.message || "Не удалось загрузить товары");
      setProducts([]);
      setTotalElements(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatPrice = (price?: number) => {
    if (!price) return "—";
    return formatKzt(price);
  };

  const getStockColor = (stock?: number): "error" | "warning" | "success" => {
    if (!stock || stock === 0) return "error";
    if (stock <= 5) return "warning";
    return "success";
  };

  const getStockText = (stock?: number) => {
    if (!stock || stock === 0) return "Нет в наличии";
    return `${stock} шт.`;
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="size-6 animate-spin rounded-full border-2 border-gray-200 border-t-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[860px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className={TH}>Товар</TableCell>
                <TableCell isHeader className={TH}>Бренд</TableCell>
                <TableCell isHeader className={TH}>Цена</TableCell>
                <TableCell isHeader className={TH}>Остаток</TableCell>
                <TableCell isHeader className={TH}>Товар недели</TableCell>
                <TableCell isHeader className={TH}>1С</TableCell>
                <TableCell isHeader className={`${TH} text-right`}>
                  <span className="sr-only">Действия</span>
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {error ? (
                <TableRow>
                  <TableCell className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400" colSpan={7}>
                    Не удалось загрузить данные.{" "}
                    <button
                      type="button"
                      onClick={() => loadProducts()}
                      className="font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
                    >
                      Повторить
                    </button>
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400" colSpan={7}>
                    Товаров пока нет
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className={TD}>
                      <div className="flex items-center gap-3">
                        <ProductThumb src={product.imageUrl} />
                        <div className="min-w-0">
                          <span className="block max-w-[320px] truncate font-medium text-gray-800 dark:text-white/90">
                            {product.name}
                          </span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400">
                            {product.code}
                            {product.externalCode && product.externalCode !== product.code ? ` · ${product.externalCode}` : ""}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className={TD}>{product.brand || "—"}</TableCell>
                    <TableCell className={`${TD} whitespace-nowrap font-medium tabular-nums`}>
                      {formatPrice(product.price)}
                    </TableCell>
                    <TableCell className={TD}>
                      <Badge size="sm" variant="light" color={getStockColor(product.stock)}>
                        {getStockText(product.stock)}
                      </Badge>
                    </TableCell>
                    <TableCell className={TD}>
                      <input
                        type="checkbox"
                        className="size-4 cursor-pointer rounded border-gray-300 accent-brand-500"
                        checked={!!product.weekly}
                        onChange={async (e) => {
                          try {
                            await productApi.setWeekly(product.id, { value: e.target.checked, autoRange: true });
                            loadProducts();
                          } catch (err) {
                            console.error("Failed to toggle weekly", err);
                            showError(
                              err instanceof Error && err.message
                                ? err.message
                                : "Не удалось изменить признак «Товар недели»"
                            );
                          }
                        }}
                        aria-label={`Товар недели: ${product.name}`}
                      />
                    </TableCell>
                    <TableCell className={TD}>
                      <Badge size="sm" variant="light" color={product.syncedWith1C ? "success" : "light"}>
                        {product.syncedWith1C ? "Да" : "Нет"}
                      </Badge>
                    </TableCell>
                    <TableCell className={TD}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onViewProduct?.(product)}
                          className={ICON_BTN}
                          title="Просмотр"
                          aria-label={`Просмотр товара ${product.name}`}
                        >
                          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                        {onEditProduct && (
                          <button
                            type="button"
                            onClick={() => onEditProduct?.(product)}
                            className={ICON_BTN}
                            title="Редактировать"
                            aria-label={`Редактировать товар ${product.name}`}
                          >
                            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                            </svg>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onDeleteProduct?.(product)}
                          className={ICON_BTN_DANGER}
                          title="Удалить"
                          aria-label={`Удалить товар ${product.name}`}
                        >
                          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
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

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalItems={totalElements}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
};

export default ProductsTable;
