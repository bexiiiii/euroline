'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import type { SearchItem, SearchWarehouse } from '@/lib/api/search';
import { useCartStore } from '@/lib/stores/cartStore';
import { toast } from 'sonner';
import { ShoppingCart } from 'lucide-react';

interface AnalogsTableProps {
  analogs: SearchItem[];
}

export default function AnalogsTable({ analogs }: AnalogsTableProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const { addByOem } = useCartStore();
  const hasAnalogs = Array.isArray(analogs) && analogs.length > 0;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-100">
          <tr>
            <HeaderCell className="text-center">Фото</HeaderCell>
            <HeaderCell>Бренд</HeaderCell>
            <HeaderCell>Артикул</HeaderCell>
            <HeaderCell>Наименование</HeaderCell>
            <HeaderCell>Склад</HeaderCell>
            <HeaderCell>Остатки</HeaderCell>
            <HeaderCell>Цена</HeaderCell>
            <HeaderCell className="text-center">Кол-во</HeaderCell>
            <HeaderCell className="text-center">Действия</HeaderCell>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {hasAnalogs ? (
            analogs.map((item, idx) => {
              const normalizedArticle = normalizeArticle(item.oem);
              const stock = computeAvailableQuantity(item);
              const priceValue = typeof item.price === 'number' ? item.price : null;
              const formattedPrice =
                priceValue !== null ? `${formatPrice(priceValue)} ${item.currency || '₸'}` : 'Цена по запросу';
              const warehouseLabel = formatWarehouses(item.warehouses);
              const defaultQuantity = stock > 0 ? 1 : 0;
              const quantityKey = `analog-${normalizedArticle}-${item.brand ?? 'UNKNOWN'}-${idx}`;
              const quantity = quantities[quantityKey] ?? defaultQuantity;
              const hasStock = stock > 0;
              const productName = item.name || item.oem || 'Товар';
              const productBrand = item.brand || 'UNKNOWN';
              const productArticle = normalizedArticle || item.oem || productName;
              const imageUrl = ensureAbsoluteUrl(item.imageUrl);

              const handleAddToCart = async () => {
                if (!hasStock) {
                  toast.error('Товар отсутствует на складах');
                  return;
                }
                if (quantity <= 0) {
                  toast.error('Укажите количество');
                  return;
                }
                try {
                  await addByOem(
                    productArticle,
                    productName,
                    productBrand,
                    quantity,
                    priceValue ?? undefined,
                    imageUrl
                  );
                  toast.success('Товар добавлен в корзину');
                } catch (error: any) {
                  console.error('Failed to add analog to cart', error);
                  toast.error(error?.message || 'Не удалось добавить товар в корзину');
                }
              };

              return (
                <tr key={quantityKey} className="hover:bg-gray-50 transition">
                  <Cell className="text-center">
                    {imageUrl ? (
                      <img src={imageUrl} alt={productName} className="w-12 h-12 object-cover rounded mx-auto" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded mx-auto flex items-center justify-center">
                        <span className="text-gray-400 text-xs">Нет фото</span>
                      </div>
                    )}
                  </Cell>
                  <Cell>
                    <div className="text-sm font-medium text-gray-900">{productBrand}</div>
                  </Cell>
                  <Cell>
                    <div className="text-sm font-mono text-gray-900">{item.oem}</div>
                  </Cell>
                  <Cell>
                    <div className="text-sm text-gray-700">{productName}</div>
                  </Cell>
                  <Cell>
                    <div className="text-sm text-gray-600">{warehouseLabel}</div>
                  </Cell>
                  <Cell>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        stock > 5
                          ? 'bg-green-100 text-green-700'
                          : stock > 0
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {stock > 0 ? `${stock} шт` : 'Нет в наличии'}
                    </span>
                  </Cell>
                  <Cell>
                    <span className="text-sm text-gray-900">{formattedPrice}</span>
                  </Cell>
                  <Cell className="text-center">
                    <input
                      type="number"
                      min={hasStock ? 1 : 0}
                      max={stock}
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 1;
                        setQuantities((prev) => ({
                          ...prev,
                          [quantityKey]: hasStock ? Math.min(Math.max(1, val), stock) : 0,
                        }));
                      }}
                      disabled={!hasStock}
                      className="w-14 px-2 py-0.5 text-center text-sm border border-gray-300 rounded disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </Cell>
                  <Cell className="text-center">
                    <button
                      onClick={handleAddToCart}
                      disabled={!hasStock}
                      className="inline-flex items-center justify-center w-9 h-9 rounded border border-transparent bg-orange-500 text-white hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                      aria-label="Добавить в корзину"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </Cell>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-500">
                Аналоги не найдены
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function normalizeArticle(value?: string | null): string {
  return (value ?? '').replace(/\s+/g, '').toUpperCase();
}

function computeAvailableQuantity(item?: SearchItem): number {
  if (!item) return 0;
  if (typeof item.quantity === 'number' && !Number.isNaN(item.quantity)) {
    return Math.max(item.quantity, 0);
  }
  if (!item.warehouses || item.warehouses.length === 0) {
    return 0;
  }
  return item.warehouses.reduce((sum, warehouse) => sum + (warehouse.qty ?? 0), 0);
}

function formatWarehouses(warehouses?: SearchWarehouse[] | null): string {
  if (!warehouses || warehouses.length === 0) {
    return 'Нет данных';
  }
  const visible = warehouses.slice(0, 2);
  const labels = visible.map((warehouse) => {
    const name = warehouse.name || warehouse.code || 'Склад';
    const qty = warehouse.qty ?? 0;
    return `${name} (${qty})`;
  });
  if (warehouses.length > visible.length) {
    labels.push(`и ещё ${warehouses.length - visible.length}`);
  }
  return labels.join(', ');
}

function ensureAbsoluteUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('/')) {
    return `https://api.umapi.ru${url}`;
  }
  return url;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function HeaderCell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase ${
        className ?? ''
      }`}
    >
      {children}
    </th>
  );
}

function Cell({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className ?? ''}`}>{children}</td>;
}
