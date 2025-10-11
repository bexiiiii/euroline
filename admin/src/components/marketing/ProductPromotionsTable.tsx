"use client";

import React, { useEffect, useState } from "react";
import { promotionsApi, Promotion } from "@/lib/api/promotions";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "../ui/table";

interface ProductPromotionsTableProps {
  pageSize?: number;
  onCreatePromotion?: () => void;
}

const statusToBadge: Record<string, { label: string; color: React.ComponentProps<typeof Badge>["color"] }> = {
  ACTIVE: { label: "Активна", color: "success" },
  INACTIVE: { label: "Отключена", color: "error" },
};

const ProductPromotionsTable: React.FC<ProductPromotionsTableProps> = ({
  pageSize = 10,
  onCreatePromotion,
}) => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await promotionsApi.getPromotions(0, pageSize);
        setPromotions(response.content ?? []);
      } catch (err) {
        console.error("Не удалось загрузить акции", err);
        setError("Не удалось загрузить список акций");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [pageSize]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-4 dark:border-white/5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Акции на товары</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Актуальные промо-предложения и скидки для товаров каталога
          </p>
        </div>
        <Button size="sm" onClick={onCreatePromotion}>
          Создать акцию
        </Button>
      </div>

      {loading && (
        <div className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
          Загрузка данных...
        </div>
      )}

      {!loading && error && (
        <div className="px-6 py-6 text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      {!loading && !error && promotions.length === 0 && (
        <div className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
          Акции не найдены
        </div>
      )}

      {!loading && !error && promotions.length > 0 && (
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableCell isHeader>Название</TableCell>
                <TableCell isHeader>Период</TableCell>
                <TableCell isHeader>Статус</TableCell>
                <TableCell isHeader>Ограничения</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions.map((promotion) => {
                const statusMeta = promotion.isActive ? statusToBadge.ACTIVE : statusToBadge.INACTIVE;
                return (
                  <TableRow key={promotion.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-gray-900 dark:text-white">{promotion.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {promotion.description || "Без описания"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {formatDate(promotion.startDate)} — {formatDate(promotion.endDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge color={statusMeta.color}>{statusMeta.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {renderConstraints(promotion)}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function renderConstraints(promotion: Promotion): string {
  const constraints: string[] = [];
  if (promotion.minOrderAmount) {
    constraints.push(`Мин. заказ ${promotion.minOrderAmount}`);
  }
  if (promotion.maxDiscountAmount) {
    constraints.push(`Макс. скидка ${promotion.maxDiscountAmount}`);
  }
  if (promotion.usageLimit) {
    constraints.push(`Лимит ${promotion.usageLimit}`);
  }
  if (promotion.applicableCategories && promotion.applicableCategories.length > 0) {
    constraints.push(`Категорий: ${promotion.applicableCategories.length}`);
  }
  if (promotion.applicableProducts && promotion.applicableProducts.length > 0) {
    constraints.push(`Товаров: ${promotion.applicableProducts.length}`);
  }
  if (constraints.length === 0) {
    return "Без ограничений";
  }
  return constraints.join(" • ");
}

export default ProductPromotionsTable;
