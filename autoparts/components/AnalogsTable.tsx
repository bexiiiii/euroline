'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { SearchItem, SearchWarehouse } from '@/lib/api/search';
import { useCartStore } from '@/lib/stores/cartStore';
import { toast } from 'sonner';
import { ShoppingCart, Package, MapPin } from 'lucide-react';

interface AnalogsTableProps {
  analogs: SearchItem[];
}

export default function AnalogsTable({ analogs }: AnalogsTableProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const { addByOem } = useCartStore();

  if (!analogs || analogs.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Аналоги не найдены</h3>
        <p className="text-gray-600">Для данного артикула аналоги не обнаружены</p>
      </div>
    );
  }

  const handleAddToCart = async (item: SearchItem, qty: number, max: number) => {
    if (max <= 0) {
      toast.error('Аналог временно отсутствует на складах');
      return;
    }
    try {
      await addByOem(
        item.oem,
        item.name,
        item.brand || 'UNKNOWN',
        qty,
        item.price,
        item.imageUrl
      );
      toast.success('Аналог добавлен в корзину');
    } catch (error: any) {
      console.error('Failed to add analog to cart:', error);
      toast.error(error?.message || 'Не удалось добавить в корзину');
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-orange-50">
          <tr>
            <HeaderCell className="text-center">Фото</HeaderCell>
            <HeaderCell>Бренд</HeaderCell>
            <HeaderCell>Артикул</HeaderCell>
            <HeaderCell>Наименование</HeaderCell>
            <HeaderCell>Склады</HeaderCell>
            <HeaderCell>Цена</HeaderCell>
            <HeaderCell className="text-center">Кол-во</HeaderCell>
            <HeaderCell className="text-center">Действия</HeaderCell>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {analogs.map((analog) => {
            const key = `${analog.oem}-${analog.brand ?? 'analog'}`;
            const available = computeAvailableQuantity(analog);
            const quantity = quantities[key] ?? (available > 0 ? 1 : 0);

            return (
              <tr key={key} className="hover:bg-gray-50 transition">
                <Cell className="text-center">
                  <Thumbnail imageUrl={analog.imageUrl} name={analog.name} />
                </Cell>
                <Cell>
                  <div className="text-sm font-medium text-gray-900">{analog.brand || '—'}</div>
                </Cell>
                <Cell>
                  <div className="text-sm font-mono text-gray-900">{analog.oem}</div>
                </Cell>
                <Cell>
                  <div className="text-sm text-gray-700">{analog.name}</div>
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded mt-1">
                    Аналог
                  </span>
                </Cell>
                <Cell>
                  <WarehouseSummary warehouses={analog.warehouses} total={available} />
                </Cell>
                <Cell>
                  {typeof analog.price === 'number' ? (
                    <div className="text-sm font-semibold text-gray-900">
                      {formatPrice(analog.price)} {analog.currency || 'тг'}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Цена по запросу</span>
                  )}
                </Cell>
                <Cell className="text-center">
                  <QuantityInput
                    value={quantity}
                    max={available}
                    onChange={(val) => setQuantities((prev) => ({ ...prev, [key]: val }))}
                  />
                </Cell>
                <Cell className="text-center">
                  <button
                    onClick={() => handleAddToCart(analog, quantity, available)}
                    disabled={available <= 0}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-orange-500 rounded hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                  >
                    <ShoppingCart className="w-3 h-3" />
                    В корзину
                  </button>
                </Cell>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function QuantityInput({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const handleChange = (next: number) => {
    if (max <= 0) {
      onChange(0);
      return;
    }
    const clamped = Math.min(Math.max(1, next), max);
    onChange(clamped);
  };

  return (
    <div className="inline-flex items-center border border-gray-300 rounded h-9 overflow-hidden">
      <button
        type="button"
        onClick={() => handleChange(value - 1)}
        disabled={value <= 1 || max <= 0}
        className="w-8 h-full flex items-center justify-center text-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed"
      >
        −
      </button>
      <input
        type="number"
        min={1}
        max={max}
        value={max > 0 ? value : 0}
        disabled={max <= 0}
        onChange={(e) => handleChange(parseInt(e.target.value, 10))}
        className="w-12 h-full text-center text-sm text-gray-900 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
      />
      <button
        type="button"
        onClick={() => handleChange(value + 1)}
        disabled={value >= max || max <= 0}
        className="w-8 h-full flex items-center justify-center text-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed"
      >
        +
      </button>
    </div>
  );
}

function WarehouseSummary({ warehouses, total }: { warehouses?: SearchWarehouse[]; total: number }) {
  if (!warehouses || warehouses.length === 0) {
    return (
      <div className="flex items-center gap-1 text-sm text-gray-500">
        <MapPin className="w-4 h-4 text-gray-400" />
        Нет данных
      </div>
    );
  }

  return (
    <div className="text-sm text-gray-700 space-y-1">
      <div className="flex items-center gap-2 font-medium">
        <MapPin className="w-4 h-4 text-green-600" />
        {total > 0 ? `Доступно: ${total} шт.` : 'Нет в наличии'}
      </div>
      <div className="space-y-1 text-xs text-gray-600">
        {warehouses.slice(0, 3).map((warehouse) => (
          <div key={warehouse.code} className="flex justify-between gap-3">
            <span className="truncate max-w-[150px]">{warehouse.name || warehouse.code}</span>
            <span className="font-semibold text-gray-900">{warehouse.qty ?? 0} шт.</span>
          </div>
        ))}
        {warehouses.length > 3 && (
          <div className="text-xs text-gray-500">и ещё {warehouses.length - 3} склад(ов)</div>
        )}
      </div>
    </div>
  );
}

function Thumbnail({ imageUrl, name }: { imageUrl?: string | null; name: string }) {
  if (!imageUrl) {
    return <Package className="w-6 h-6 text-gray-400 mx-auto" />;
  }
  return (
    <img
      src={ensureAbsoluteUrl(imageUrl)}
      alt={name}
      className="w-12 h-12 object-cover rounded mx-auto"
    />
  );
}

function computeAvailableQuantity(item: SearchItem): number {
  if (typeof item.quantity === 'number' && !Number.isNaN(item.quantity)) {
    return Math.max(item.quantity, 0);
  }
  if (!item.warehouses || item.warehouses.length === 0) {
    return 0;
  }
  return item.warehouses.reduce((sum, warehouse) => sum + (warehouse.qty ?? 0), 0);
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function ensureAbsoluteUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('/')) {
    return `https://api.umapi.ru${url}`;
  }
  return url;
}

function HeaderCell({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <th
      className={`px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase ${className ?? ''}`}
    >
      {children}
    </th>
  );
}

function Cell({ className, children }: { className?: string; children: ReactNode }) {
  return <td className={`px-4 py-3 align-top ${className ?? ''}`}>{children}</td>;
}
