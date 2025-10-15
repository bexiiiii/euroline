'use client';

import React from 'react';
import { ShoppingCart, Package, Loader2 } from 'lucide-react';
import { type AnalogItem } from '@/lib/api/search';
import { useCartStore } from '@/lib/stores/cartStore';
import { toast } from 'sonner';

interface AnalogsTableProps {
  analogs: AnalogItem[];
  isLoading?: boolean;
}

export default function AnalogsTable({ analogs, isLoading }: AnalogsTableProps) {
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

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      'OEM': 'bg-green-100 text-green-700',
      'OES': 'bg-blue-100 text-blue-700',
      'Indefinite': 'bg-gray-100 text-gray-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getTargetBadge = (target: string) => {
    const colors: Record<string, string> = {
      'Original': 'bg-purple-100 text-purple-700',
      'Cross': 'bg-orange-100 text-orange-700',
    };
    return colors[target] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-orange-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Бренд</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Артикул</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Наименование</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Тип</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Категория</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase">Фото</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase">Действия</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {analogs.map((analog, idx) => (
            <tr key={`${analog.article}-${analog.brand}-${idx}`} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                {analog.brand}
              </td>
              <td className="px-6 py-4 text-sm font-mono text-gray-900">
                {analog.article}
              </td>
              <td className="px-6 py-4 text-sm text-gray-700">
                {analog.title}
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getTypeBadge(analog.type)}`}>
                  {analog.type}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getTargetBadge(analog.target)}`}>
                  {analog.target}
                </span>
              </td>
              <td className="px-6 py-4 text-center">
                {analog.img ? (
                  <img 
                    src={analog.img} 
                    alt={analog.title}
                    className="w-12 h-12 object-cover rounded mx-auto"
                  />
                ) : (
                  <span className="text-gray-400 text-xs">Нет фото</span>
                )}
              </td>
              <td className="px-6 py-4 text-center">
                <button
                  onClick={() => handleAddToCart(analog)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-orange-500 rounded hover:bg-orange-600 transition"
                >
                  <ShoppingCart className="w-3 h-3" />
                  В корзину
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
