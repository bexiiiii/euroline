/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { categoriesApi, Category } from "@/lib/api/categories";

interface CategoriesTableProps {
  refreshKey: number;
  parentNameById?: Record<number, string>;
  onEdit?: (category: Category) => void;
  onAddSubcategory?: (category: Category) => void;
  onToggleStatus?: (category: Category) => void;
  onDelete?: (category: Category) => void;
}

interface TreeRow {
  category: Category;
  depth: number;
}

const CategoriesTable: React.FC<CategoriesTableProps> = ({
  refreshKey,
  parentNameById,
  onEdit,
  onAddSubcategory,
  onToggleStatus,
  onDelete,
}) => {
  const [tree, setTree] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const loadTree = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await categoriesApi.getCategoryTree();
        setTree(response);

        const expanded = new Set<number>();
        const collect = (nodes: Category[]) => {
          nodes.forEach((category) => {
            expanded.add(category.id);
            if (category.subcategories && category.subcategories.length > 0) {
              collect(category.subcategories);
            }
          });
        };
        collect(response);
        setExpandedIds(expanded);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Не удалось загрузить категории";
        setError(message);
        setTree([]);
      } finally {
        setLoading(false);
      }
    };

    loadTree();
  }, [refreshKey]);

  const rows = useMemo<TreeRow[]>(() => {
    const result: TreeRow[] = [];

    const walk = (nodes: Category[], depth: number) => {
      nodes.forEach((category) => {
        result.push({ category, depth });
        if (
          category.subcategories &&
          category.subcategories.length > 0 &&
          expandedIds.has(category.id)
        ) {
          walk(category.subcategories, depth + 1);
        }
      });
    };

    walk(tree, 0);
    return result;
  }, [tree, expandedIds]);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("ru-RU");
  };

  const getStatusColor = (isActive: boolean): "success" | "error" => {
    return isActive ? "success" : "error";
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? "Активна" : "Неактивна";
  };

  const renderCategoryTag = (category: Category, depth: number) => {
    if (depth === 0) {
      return (
        <Badge size="sm" variant="light" color="info">
          Основная категория
        </Badge>
      );
    }

    const parentName = category.parentId ? parentNameById?.[category.parentId] : undefined;

    return (
      <div className="flex flex-col gap-1">
        <Badge size="sm" variant="solid" color="dark">
          Подкатегория
        </Badge>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {parentName ? `Входит в: ${parentName}` : `ID родителя: ${category.parentId}`}
        </span>
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[1100px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Категория
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Тип
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Описание
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Товары
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Статус
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Создана
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Действия
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {loading ? (
                <TableRow>
                  <TableCell className="px-5 py-6 text-center" colSpan={7}>
                    <div className="flex items-center justify-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                      Загрузка категорий...
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell className="px-5 py-6 text-center text-red-600" colSpan={7}>
                    Ошибка: {error}
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell className="px-5 py-6 text-center" colSpan={7}>
                    Категории пока не созданы
                  </TableCell>
                </TableRow>
              ) : (
                rows.map(({ category, depth }) => {
                  const hasChildren = category.subcategories && category.subcategories.length > 0;
                  const isExpanded = hasChildren && expandedIds.has(category.id);
                  const rowClasses = depth > 0 ? "bg-blue-50/60 dark:bg-blue-900/10" : "";

                  return (
                    <TableRow key={category.id} className={rowClasses}>
                      <TableCell className="px-5 py-4 text-start">
                        <div className="flex items-center gap-3" style={{ paddingLeft: depth * 24 }}>
                          {hasChildren ? (
                            <button
                              onClick={() => toggleExpand(category.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition hover:border-brand-300 hover:text-brand-500 dark:border-white/10 dark:text-gray-300"
                              aria-label={isExpanded ? "Свернуть" : "Развернуть"}
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
                              >
                                <path
                                  d="M8 5l8 7-8 7"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          ) : (
                            <span className="inline-flex h-7 w-7 items-center justify-center text-gray-300 dark:text-gray-600">
                              •
                            </span>
                          )}

                          {category.imageUrl ? (
                            <img
                              src={category.imageUrl}
                              alt={category.name}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-white/10">
                              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                {category.name.slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                          )}

                          <div>
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {category.name}
                            </span>
                            <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                              ID: {category.id} • Slug: {category.slug}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        {renderCategoryTag(category, depth)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-700 dark:text-gray-300 max-w-xs">
                        <span className="line-clamp-2">
                          {category.description || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-700 dark:text-gray-300">
                        {category.productCount || 0}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm">
                        <Badge size="sm" color={getStatusColor(category.isActive)}>
                          {getStatusText(category.isActive)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                        {formatDate(category.createdAt)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => onEdit?.(category)}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-300"
                            title="Редактировать"
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
                          <button
                            onClick={() => onAddSubcategory?.(category)}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                            title="Добавить подкатегорию"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" />
                              <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" />
                            </svg>
                          </button>
                          <button
                            onClick={() => onToggleStatus?.(category)}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/20 dark:hover:text-amber-300"
                            title={category.isActive ? "Деактивировать" : "Активировать"}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M5 12s2-7 7-7 7 7 7 7-2 7-7 7-7-7-7-7z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                            </svg>
                          </button>
                          <button
                            onClick={() => onDelete?.(category)}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                            title="Удалить"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                              <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                              <path
                                d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path d="M10 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                              <path d="M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default CategoriesTable;
