'use client';

import React, { useState } from 'react';
import { ShoppingCart, Package, MapPin, Clock, Info } from 'lucide-react';
import { SearchItem, SearchWarehouse } from '@/lib/api/search';
import { useSearchStore } from '@/lib/stores/searchStore';
import { useCartStore } from '@/lib/stores/cartStore';

interface SearchResultsTableProps {
  className?: string;
}

export default function SearchResultsTable({ className }: SearchResultsTableProps) {
  const { results, isLoading, detectedType, vehicle } = useSearchStore();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-8">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-3 text-gray-600">
            <div className="w-6 h-6 border-2 border-gray-400 border-t-orange-500 rounded-full animate-spin" />
            <span>Поиск автозапчастей...</span>
          </div>
        </div>
      </div>
    );
  }

  // Если найден автомобиль по VIN/Frame
  if (vehicle) {
    return (
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Найден автомобиль</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-4">
              <Package className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h4 className="font-semibold text-blue-900">{vehicle.brand} {vehicle.name}</h4>
                <div className="text-sm text-blue-700 mt-2 space-y-1">
                  <div><span className="font-medium">ID автомобиля:</span> {vehicle.vehicleId}</div>
                  <div><span className="font-medium">SSD:</span> {vehicle.ssd}</div>
                  <div><span className="font-medium">Каталог:</span> {vehicle.catalog}</div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-gray-600 mt-4">
            Для поиска запчастей для этого автомобиля перейдите в каталог или уточните запрос.
          </p>
        </div>
      </div>
    );
  }

  // Если результаты не найдены
  if (!results || results.length === 0) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-8">
        <div className="text-center text-gray-600">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ничего не найдено</h3>
          <p>Попробуйте изменить поисковый запрос или проверить правильность написания артикула.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">
          Найдено {results.length} автозапчастей
        </h3>
        {detectedType && (
          <p className="text-sm text-gray-600 mt-1">
            Тип поиска: {getSearchTypeLabel(detectedType)}
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Запчасть
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Артикул / Бренд
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Наличие
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Цена
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {results.map((item, index) => (
              <SearchResultRow key={`${item.oem}-${index}`} item={item} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface SearchResultRowProps {
  item: SearchItem;
}

function SearchResultRow({ item }: SearchResultRowProps) {
  const [showWarehouses, setShowWarehouses] = useState(false);
  const { addByOem } = useCartStore();

  const hasStock = item.quantity && item.quantity > 0;
  
  return (
    <>
      <tr className="hover:bg-gray-50">
        {/* Запчасть */}
        <td className="px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="w-16 h-12 bg-gray-100 rounded border flex-shrink-0 flex items-center justify-center">
              {item.imageUrl ? (
                <img 
                  src={item.imageUrl} 
                  alt={item.name}
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <Package className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                {item.name}
              </h4>
              {item.catalog && (
                <p className="text-xs text-gray-500 mt-1">Каталог: {item.catalog}</p>
              )}
            </div>
          </div>
        </td>

        {/* Артикул / Бренд */}
        <td className="px-6 py-4">
          <div>
            <div className="text-sm font-mono font-medium text-gray-900">
              {item.oem}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {item.brand}
            </div>
          </div>
        </td>

        {/* Наличие */}
        <td className="px-6 py-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${hasStock ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium">
                {hasStock ? `${item.quantity} шт.` : 'Нет в наличии'}
              </span>
            </div>
            
            {item.warehouses && item.warehouses.length > 0 && (
              <button
                onClick={() => setShowWarehouses(!showWarehouses)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                <MapPin className="w-3 h-3" />
                {item.warehouses.length} склада
                <Info className="w-3 h-3" />
              </button>
            )}
          </div>
        </td>

        {/* Цена */}
        <td className="px-6 py-4">
          {item.price ? (
            <div>
              <div className="text-lg font-bold text-gray-900">
                {formatPrice(item.price)} {item.currency || 'тг'}
              </div>
            </div>
          ) : (
            <span className="text-sm text-gray-500">Цена по запросу</span>
          )}
        </td>

        {/* Действия */}
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                try {
                  await addByOem(item.oem, item.name, item.brand || 'UNKNOWN', 1, item.price, item.imageUrl);
                } catch {}
              }}
              disabled={!hasStock}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-orange-500 rounded hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-3 h-3" />
              В корзину
            </button>
          </div>
        </td>
      </tr>

      {/* Склады */}
      {showWarehouses && item.warehouses && (
        <tr>
          <td colSpan={5} className="px-6 py-2 bg-gray-50">
            <div className="space-y-2">
              <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                Наличие на складах:
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {item.warehouses.map((warehouse, idx) => (
                  <WarehouseItem key={`${warehouse.code}-${idx}`} warehouse={warehouse} />
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

interface WarehouseItemProps {
  warehouse: SearchWarehouse;
}

function WarehouseItem({ warehouse }: WarehouseItemProps) {
  return (
    <div className="flex items-center justify-between p-2 bg-white border rounded text-xs">
      <div>
        <div className="font-medium text-gray-900">{warehouse.name}</div>
        <div className="text-gray-500">{warehouse.address}</div>
      </div>
      <div className="text-right">
        <div className="font-medium text-gray-900">{warehouse.qty} шт.</div>
        <div className="text-gray-500">({warehouse.code})</div>
      </div>
    </div>
  );
}

function getSearchTypeLabel(type: string): string {
  switch (type) {
    case 'VIN':
      return 'Поиск по VIN-номеру';
    case 'FRAME':
      return 'Поиск по номеру кузова';
    case 'PLATE':
      return 'Поиск по гос. номеру';
    case 'OEM':
      return 'Поиск по артикулу';
    case 'TEXT':
      return 'Текстовый поиск';
    default:
      return type;
  }
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}
