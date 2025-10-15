'use client';

import React, { useState } from 'react';
import { ShoppingCart, Package, Loader2 } from 'lucide-react';
import { type AnalogItem } from '@/lib/api/search';
import { useCartStore } from '@/lib/stores/cartStore';
import { toast } from 'sonner';

interface AnalogsTableProps {
  analogs: AnalogItem[];
  isLoading?: boolean;
  quantities?: Record<string, number>;
  onQuantityChange?: (key: string, value: number) => void;
}

export default function AnalogsTable({ analogs, isLoading, quantities = {}, onQuantityChange }: AnalogsTableProps) {
  const { addByOem } = useCartStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <span className="ml-3 text-gray-600">Загрузка аналогов...</span>
      </div>
    );
  }

  if (!analogs || analogs.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Аналоги не найдены
        </h3>
        <p className="text-gray-600">
          Для данного артикула аналоги не обнаружены
        </p>
      </div>
    );
  }

  const handleAddToCart = async (analog: AnalogItem) => {
    try {
      await addByOem(
        analog.article,
        analog.title || analog.article,
        analog.brand,
        1,
        undefined,
        analog.img || undefined
      );
      toast.success('Аналог добавлен в корзину');
    } catch (error) {
      console.error('Failed to add analog to cart:', error);
      toast.error('Не удалось добавить в корзину');
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-orange-50">
          <tr>
            <th className="px-4 py-2 text-center text-xs font-medium text-gray-600 uppercase">Фото</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Бренд</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Артикул</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Наименование</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Остатки</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Цена</th>
            <th className="px-4 py-2 text-center text-xs font-medium text-gray-600 uppercase">Кол-во</th>
            <th className="px-4 py-2 text-center text-xs font-medium text-gray-600 uppercase">Действия</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {analogs.map((analog, idx) => {
            const stock = Math.floor(Math.random() * 15); // Временно рандомные остатки
            const itemKey = `analog-${analog.article}-${analog.brand}-${idx}`;
            const quantity = quantities[itemKey] || 1;
            
            return (
              <tr key={itemKey} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-center">
                  {analog.img ? (
                    <img 
                      src={`https://api.umapi.ru${analog.img}`}
                      alt={analog.title}
                      className="w-12 h-12 object-cover rounded mx-auto"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded mx-auto flex items-center justify-center">
                      <span className="text-gray-400 text-xs">Нет фото</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-2 text-sm font-medium text-gray-900">
                  {analog.brand}
                </td>
                <td className="px-4 py-2 text-sm font-mono text-gray-900">
                  {analog.article}
                </td>
                <td className="px-4 py-2 text-sm text-gray-700">
                  {analog.title}
                </td>
                <td className="px-4 py-2 text-sm">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                    stock > 5 ? 'bg-green-100 text-green-700' : 
                    stock > 0 ? 'bg-yellow-100 text-yellow-700' : 
                    'bg-red-100 text-red-700'
                  }`}>
                    {stock > 0 ? `${stock} шт` : 'Нет в наличии'}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm text-gray-500">
                  По запросу
                </td>
                <td className="px-4 py-2 text-center">
                  <input 
                    type="number" 
                    min="1"
                    max={stock}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      const newQty = Math.min(Math.max(1, val), stock);
                      onQuantityChange?.(itemKey, newQty);
                    }}
                    disabled={stock === 0}
                    className="w-14 px-2 py-0.5 text-center text-sm border border-gray-300 rounded disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => {
                      const token = localStorage.getItem('authToken');
                      if (!token) {
                        toast.error('Сначала войдите в аккаунт');
                        return;
                      }
                      if (quantity > stock) {
                        toast.error(`Доступно только ${stock} шт`);
                        return;
                      }
                      handleAddToCart(analog);
                    }}
                    disabled={stock === 0}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-orange-500 rounded hover:bg-orange-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    В корзину
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
