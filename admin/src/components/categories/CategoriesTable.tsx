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

const TH = "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400";
const TD = "px-4 py-3 text-sm text-gray-700 dark:text-gray-300";
const ICON_BTN =
  "inline-flex size-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-gray-200";
const ICON_BTN_DANGER =
  "inline-flex size-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-error-50 hover:text-error-600 dark:text-gray-400 dark:hover:bg-error-500/15 dark:hover:text-error-500";

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
  onEdit,
  onAddSubcategory,
  onToggleStatus,
  onDelete,
}) => {
  const [tree, setTree] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [reloadKey, setReloadKey] = useState(0);

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
  }, [refreshKey, reloadKey]);

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

  const iconSvg = "size-4";
  const svgProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[760px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className={TH}>Категория</TableCell>
                <TableCell isHeader className={TH}>Товары</TableCell>
                <TableCell isHeader className={TH}>Статус</TableCell>
                <TableCell isHeader className={TH}>Создана</TableCell>
                <TableCell isHeader className={`${TH} text-right`}>
                  <span className="sr-only">Действия</span>
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <TableRow>
                  <TableCell className="px-4 py-6 text-center" colSpan={5}>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="inline-flex size-4 animate-spin rounded-full border-2 border-gray-200 border-t-brand-500" />
                      Загрузка...
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400" colSpan={5}>
                    Не удалось загрузить данные.{" "}
                    <button
                      type="button"
                      onClick={() => setReloadKey((k) => k + 1)}
                      className="font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
                    >
                      Повторить
                    </button>
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400" colSpan={5}>
                    Категорий пока нет
                  </TableCell>
                </TableRow>
              ) : (
                rows.map(({ category, depth }) => {
                  const hasChildren = category.subcategories && category.subcategories.length > 0;
                  const isExpanded = hasChildren && expandedIds.has(category.id);

                  return (
                    <TableRow key={category.id}>
                      <TableCell className={TD}>
                        <div className="flex items-center gap-2" style={{ paddingLeft: depth * 28 }}>
                          {hasChildren ? (
                            <button
                              type="button"
                              onClick={() => toggleExpand(category.id)}
                              className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.06]"
                              aria-label={isExpanded ? "Свернуть" : "Развернуть"}
                            >
                              <svg {...svgProps} className={`size-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`}>
                                <path d="M9 6l6 6-6 6" />
                              </svg>
                            </button>
                          ) : (
                            <span className="size-6 shrink-0" />
                          )}

                          {category.imageUrl ? (
                            <img
                              src={category.imageUrl}
                              alt={category.name}
                              className="size-8 shrink-0 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-medium text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
                              {category.name.slice(0, 1).toUpperCase()}
                            </div>
                          )}

                          <span className={depth === 0 ? "font-medium text-gray-800 dark:text-white/90" : "text-gray-700 dark:text-gray-300"}>
                            {category.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className={`${TD} tabular-nums`}>
                        {category.productCount || 0}
                      </TableCell>
                      <TableCell className={TD}>
                        <Badge size="sm" variant="light" color={category.isActive ? "success" : "light"}>
                          {category.isActive ? "Активна" : "Скрыта"}
                        </Badge>
                      </TableCell>
                      <TableCell className={`${TD} whitespace-nowrap text-gray-500 dark:text-gray-400`}>
                        {formatDate(category.createdAt)}
                      </TableCell>
                      <TableCell className={TD}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onAddSubcategory?.(category)}
                            className={ICON_BTN}
                            title="Добавить подкатегорию"
                            aria-label={`Добавить подкатегорию в ${category.name}`}
                          >
                            <svg {...svgProps} className={iconSvg}>
                              <path d="M12 5v14m7-7H5" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleStatus?.(category)}
                            className={ICON_BTN}
                            title={category.isActive ? "Скрыть" : "Активировать"}
                            aria-label={`${category.isActive ? "Скрыть" : "Активировать"} категорию ${category.name}`}
                          >
                            {category.isActive ? (
                              <svg {...svgProps} className={iconSvg}>
                                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" />
                              </svg>
                            ) : (
                              <svg {...svgProps} className={iconSvg}>
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => onEdit?.(category)}
                            className={ICON_BTN}
                            title="Редактировать"
                            aria-label={`Редактировать категорию ${category.name}`}
                          >
                            <svg {...svgProps} className={iconSvg}>
                              <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete?.(category)}
                            className={ICON_BTN_DANGER}
                            title="Удалить"
                            aria-label={`Удалить категорию ${category.name}`}
                          >
                            <svg {...svgProps} className={iconSvg}>
                              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
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
