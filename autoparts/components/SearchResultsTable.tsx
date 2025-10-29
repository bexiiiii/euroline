/* eslint-disable @next/next/no-img-element */
'use client';

import { useMemo, useState, useEffect } from 'react';
import type { PropsWithChildren } from 'react';
import { Package, ShoppingCart, MapPin } from 'lucide-react';
import { SearchItem, SearchVehicle, SearchWarehouse } from '@/lib/api/search';
import { useSearchStore } from '@/lib/stores/searchStore';
import { useCartStore } from '@/lib/stores/cartStore';
import { toast } from 'sonner';

type SearchType = 'VIN' | 'FRAME' | 'PLATE' | 'OEM' | 'TEXT' | null;

interface SearchResultsTableProps {
  className?: string;
  items?: SearchItem[];
  isLoading?: boolean;
  detectedType?: SearchType;
  vehicle?: SearchVehicle | null;
  total?: number;
  page?: number;
  pageSize?: number;
  emptyMessage?: string;
}

export default function SearchResultsTable(props: SearchResultsTableProps) {
  const {
    className,
    items,
    isLoading: isLoadingProp,
    detectedType: detectedTypeProp,
    vehicle: vehicleProp,
    total,
    page,
    pageSize,
    emptyMessage,
  } = props;

  const searchStore = useSearchStore();
  const resultsFromStore = searchStore.results ?? [];
  const combinedResults = items ?? resultsFromStore;
  const primaryItems = useMemo(
    () => combinedResults.filter((item) => item.catalog !== 'UMAPI_ANALOG'),
    [combinedResults]
  );
  const analogItems = useMemo(
    () => combinedResults.filter((item) => item.catalog === 'UMAPI_ANALOG'),
    [combinedResults]
  );
  const [analogBrandFilter, setAnalogBrandFilter] = useState('');
  const [showAllAnalogs, setShowAllAnalogs] = useState(false);

  const filteredAnalogItems = useMemo(() => {
    const normalizedFilter = analogBrandFilter.trim().toLowerCase();
    if (!normalizedFilter) {
      return analogItems;
    }
    return analogItems.filter((item) => {
      if (!item.brand) return false;
      return item.brand.toLowerCase().includes(normalizedFilter);
    });
  }, [analogItems, analogBrandFilter]);

  const analogDisplayLimit = 5;
  const displayedAnalogItems = useMemo(() => {
    if (showAllAnalogs) {
      return filteredAnalogItems;
    }
    return filteredAnalogItems.slice(0, analogDisplayLimit);
  }, [filteredAnalogItems, showAllAnalogs]);

  useEffect(() => {
    setShowAllAnalogs(false);
  }, [analogBrandFilter]);
  const hiddenAnalogsCount = Math.max(filteredAnalogItems.length - analogDisplayLimit, 0);

  const isLoading = isLoadingProp ?? searchStore.isLoading;
  const detectedType = detectedTypeProp ?? searchStore.detectedType ?? null;
  const vehicle = vehicleProp ?? searchStore.vehicle ?? null;

  const totalCount = typeof total === 'number' ? total : primaryItems.length;
  const currentPage = page ?? 0;
  const currentPageSize = pageSize ?? (primaryItems.length || 1);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-8">
        <div className="flex items-center justify-center gap-3 text-gray-600">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin" />
          <span>Поиск автозапчастей...</span>
        </div>
      </div>
    );
  }

  if (vehicle) {
    return <VehicleResultCard vehicle={vehicle} />;
  }

  if (primaryItems.length === 0 && analogItems.length === 0) {
    const message =
      emptyMessage ??
      'Попробуйте изменить поисковый запрос или проверить правильность написания артикула.';
    return <EmptyResult message={message} />;
  }

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className ?? ''}`}>
      <Header
        detectedType={detectedType}
        totalCount={totalCount}
        displayed={primaryItems.length}
        page={currentPage}
        pageSize={currentPageSize}
      />

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-t border-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <Th>Запчасть</Th>
              <Th>Артикул / Бренд</Th>
              <Th>Склады</Th>
              <Th>Цена</Th>
              <Th className="text-center">Количество</Th>
              <Th className="text-center">Действия</Th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {primaryItems.map((item) => (
              <DesktopRow key={`${item.oem}-${item.brand ?? 'unknown'}`} item={item} />
            ))}
          </tbody>
        </table>
      </div>

  <div className="md:hidden divide-y divide-gray-100">
        {primaryItems.map((item) => (
          <MobileCard key={`${item.oem}-${item.brand ?? 'unknown'}-mobile`} item={item} />
        ))}
      </div>

      {analogItems.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="px-4 py-4 border-b border-gray-200 bg-white">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Аналоги и заменители ({filteredAnalogItems.length})
                </h4>
                <p className="text-xs text-gray-600 mt-1">
                  Эти предложения найдены в UMAPI и дополнены данными по остаткам из 1С.
                </p>
              </div>
              <div className="w-full md:w-64">
                <label htmlFor="analog-brand-filter" className="sr-only">
                  Фильтр по бренду
                </label>
                <input
                  id="analog-brand-filter"
                  type="text"
                  value={analogBrandFilter}
                  onChange={(event) => setAnalogBrandFilter(event.target.value)}
                  placeholder="Фильтр по бренду"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {filteredAnalogItems.length === 0 ? (
            <div className="px-4 py-6 bg-white text-sm text-gray-600">
              {analogBrandFilter.trim()
                ? `Нет аналогов для бренда "${analogBrandFilter.trim()}".`
                : 'Аналогичные предложения отсутствуют.'}
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white">
                    <tr>
                      <Th>Аналог</Th>
                      <Th>Артикул / Бренд</Th>
                      <Th>Склады</Th>
                      <Th>Цена</Th>
                      <Th className="text-center">Количество</Th>
                      <Th className="text-center">Действия</Th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {displayedAnalogItems.map((item) => (
                      <DesktopRow key={`${item.oem}-${item.brand ?? 'analog'}-analog`} item={item} />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden divide-y divide-gray-100 bg-white">
                {displayedAnalogItems.map((item) => (
                  <MobileCard key={`${item.oem}-${item.brand ?? 'analog'}-analog-mobile`} item={item} />
                ))}
              </div>

              {hiddenAnalogsCount > 0 && (
                <div className="px-4 py-3 bg-white border-t border-gray-200 text-center">
                  <button
                    type="button"
                    onClick={() => setShowAllAnalogs((prev) => !prev)}
                    className="text-sm font-medium text-orange-600 hover:text-orange-700 hover:underline"
                  >
                    {showAllAnalogs ? 'Свернуть' : `Показать все (${hiddenAnalogsCount})`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Header({
  detectedType,
  totalCount,
  displayed,
  page,
  pageSize,
}: {
  detectedType: SearchType;
  totalCount: number;
  displayed: number;
  page: number;
  pageSize: number;
}) {
  return (
    <div className="p-4 border-b border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900">
        {totalCount > 0 ? `Найдено ${totalCount} автозапчастей` : 'Результаты поиска'}
      </h3>
      {(detectedType || totalCount > displayed) && (
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
          {detectedType && <span>Тип поиска: {getSearchTypeLabel(detectedType)}</span>}
          {totalCount > displayed && (
            <span>Показано {formatRange(page, pageSize, displayed, totalCount)}</span>
          )}
        </div>
      )}
    </div>
  );
}

function DesktopRow({ item }: { item: SearchItem }) {
  const { addByOem } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const maxQuantity = useMemo(() => computeAvailableQuantity(item), [item]);
  const hasStock = maxQuantity > 0;

  useEffect(() => {
    setQuantity(hasStock ? 1 : 0);
  }, [hasStock]);

  const handleAddToCart = async () => {
    if (!hasStock) {
      toast.error('Товар отсутствует на складах');
      return;
    }
    try {
      await addByOem(
        item.oem,
        item.name,
        item.brand || 'UNKNOWN',
        quantity,
        item.price,
        item.imageUrl
      );
      toast.success('Товар добавлен в корзину');
    } catch (error: any) {
      console.error('Не удалось добавить товар в корзину', error);
      toast.error(error?.message || 'Не удалось добавить товар в корзину');
    }
  };

  return (
    <tr className="hover:bg-gray-50 transition">
      <Td>
        <div className="flex items-start gap-3">
          <div className="w-16 h-14 bg-gray-100 border rounded flex items-center justify-center overflow-hidden">
            {item.imageUrl ? (
              <img src={ensureAbsoluteUrl(item.imageUrl)} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <Package className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 line-clamp-2">{item.name}</div>
            {item.catalog && (
              <div className="text-xs text-gray-500 mt-1">Каталог: {item.catalog}</div>
            )}
          </div>
        </div>
      </Td>
      <Td>
        <div className="space-y-1">
          <div className="text-sm font-mono font-medium text-gray-900">{item.oem}</div>
          {item.brand && <div className="text-sm text-gray-600">{item.brand}</div>}
        </div>
      </Td>
      <Td>
        <WarehouseSummary warehouses={item.warehouses} total={maxQuantity} />
      </Td>
      <Td>
        {typeof item.price === 'number' ? (
          <div className="text-lg font-bold text-gray-900">
            {formatPrice(item.price)} {item.currency || 'тг'}
          </div>
        ) : (
          <span className="text-sm text-gray-500">Цена по запросу</span>
        )}
      </Td>
      <Td className="text-center">
        <QuantitySelector
          quantity={quantity}
          max={maxQuantity}
          disabled={!hasStock}
          onChange={setQuantity}
        />
      </Td>
      <Td className="text-center">
        <button
          onClick={handleAddToCart}
          disabled={!hasStock}
          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-orange-500 rounded hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          <ShoppingCart className="w-3 h-3" />
          В корзину
        </button>
      </Td>
    </tr>
  );
}

function MobileCard({ item }: { item: SearchItem }) {
  const { addByOem } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const maxQuantity = useMemo(() => computeAvailableQuantity(item), [item]);
  const hasStock = maxQuantity > 0;

  useEffect(() => {
    setQuantity(hasStock ? 1 : 0);
  }, [hasStock]);

  const handleAddToCart = async () => {
    if (!hasStock) {
      toast.error('Товар отсутствует на складах');
      return;
    }
    try {
      await addByOem(
        item.oem,
        item.name,
        item.brand || 'UNKNOWN',
        quantity,
        item.price,
        item.imageUrl
      );
      toast.success('Товар добавлен в корзину');
    } catch (error: any) {
      console.error('Не удалось добавить товар', error);
      toast.error(error?.message || 'Не удалось добавить в корзину');
    }
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-20 h-20 bg-gray-100 border rounded-lg flex items-center justify-center overflow-hidden">
          {item.imageUrl ? (
            <img src={ensureAbsoluteUrl(item.imageUrl)} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <Package className="w-6 h-6 text-gray-400" />
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="text-sm font-semibold text-gray-900">{item.name}</div>
          <div className="text-xs font-mono text-gray-700">{item.oem}</div>
          {item.brand && <div className="text-xs text-gray-600">{item.brand}</div>}
        </div>
      </div>

      <WarehouseSummary warehouses={item.warehouses} total={maxQuantity} compact />

      <div className="flex items-center justify-between">
        {typeof item.price === 'number' ? (
          <div className="text-lg font-bold text-gray-900">
            {formatPrice(item.price)} {item.currency || 'тг'}
          </div>
        ) : (
          <span className="text-sm text-gray-500">Цена по запросу</span>
        )}
        <QuantitySelector
          quantity={quantity}
          max={maxQuantity}
          disabled={!hasStock}
          onChange={setQuantity}
          compact
        />
      </div>

      <button
        onClick={handleAddToCart}
        disabled={!hasStock}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
      >
        <ShoppingCart className="w-4 h-4" />
        В корзину
      </button>
    </div>
  );
}

function QuantitySelector({
  quantity,
  max,
  disabled,
  onChange,
  compact,
}: {
  quantity: number;
  max: number;
  disabled?: boolean;
  compact?: boolean;
  onChange: (value: number) => void;
}) {
  const apply = (val: number) => {
    if (Number.isNaN(val)) return;
    if (max <= 0) {
      onChange(0);
      return;
    }
    const clamped = Math.min(Math.max(1, val), max);
    onChange(clamped);
  };

  return (
    <div
      className={`inline-flex items-center border border-gray-300 rounded ${
        compact ? 'h-8' : 'h-9'
      } overflow-hidden`}
    >
      <button
        type="button"
        onClick={() => apply(quantity - 1)}
        disabled={disabled || quantity <= 1}
        className="w-8 h-full flex items-center justify-center text-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed"
      >
        −
      </button>
      <input
        type="number"
        min={1}
        max={max}
        value={max > 0 ? quantity : 0}
        disabled={disabled || max <= 0}
        onChange={(e) => apply(parseInt(e.target.value, 10))}
        className="w-12 h-full text-center text-sm text-gray-900 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
      />
      <button
        type="button"
        onClick={() => apply(quantity + 1)}
        disabled={disabled || quantity >= max}
        className="w-8 h-full flex items-center justify-center text-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed"
      >
        +
      </button>
    </div>
  );
}

function WarehouseSummary({
  warehouses,
  total,
  compact,
}: {
  warehouses?: SearchWarehouse[];
  total: number;
  compact?: boolean;
}) {
  if (!warehouses || warehouses.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <MapPin className="w-4 h-4 text-gray-400" />
        Нет складских данных
      </div>
    );
  }

  const maxVisible = compact ? 2 : 3;
  const visibleWarehouses = warehouses.slice(0, maxVisible);
  const remaining = warehouses.length - visibleWarehouses.length;

  return (
    <div className="text-sm text-gray-700 space-y-1">
      <div className="flex items-center gap-2 font-medium">
        <MapPin className="w-4 h-4 text-green-600" />
        <span>{total > 0 ? `Доступно: ${total} шт.` : 'Нет в наличии'}</span>
      </div>
      <div className="space-y-1 text-xs text-gray-600">
        {visibleWarehouses.map((warehouse) => (
          <div key={warehouse.code} className="flex justify-between gap-3">
            <span className="truncate max-w-[150px]">{warehouse.name || warehouse.code}</span>
            <span className="font-semibold text-gray-900">{warehouse.qty ?? 0} шт.</span>
          </div>
        ))}
        {remaining > 0 && <div className="text-xs text-gray-500">и ещё {remaining} склад(ов)</div>}
      </div>
    </div>
  );
}

function VehicleResultCard({ vehicle }: { vehicle: SearchVehicle }) {
  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Найден автомобиль</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-4">
            <Package className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h4 className="font-semibold text-blue-900">
                {vehicle.brand} {vehicle.name}
              </h4>
              <div className="text-sm text-blue-700 mt-2 space-y-1">
                <div>
                  <span className="font-medium">ID автомобиля:</span> {vehicle.vehicleId}
                </div>
                <div>
                  <span className="font-medium">SSD:</span> {vehicle.ssd}
                </div>
                <div>
                  <span className="font-medium">Каталог:</span> {vehicle.catalog}
                </div>
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

function EmptyResult({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-lg border shadow-sm p-8">
      <div className="text-center text-gray-600">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Ничего не найдено</h3>
        <p>{message}</p>
      </div>
    </div>
  );
}

function Th({ className, children }: PropsWithChildren<{ className?: string }>) {
  return (
    <th
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
        className ?? ''
      }`}
    >
      {children}
    </th>
  );
}

function Td({ className, children }: PropsWithChildren<{ className?: string }>) {
  return <td className={`px-6 py-4 align-top ${className ?? ''}`}>{children}</td>;
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

function formatRange(page: number, pageSize: number, displayed: number, total: number): string {
  if (total <= 0 || displayed <= 0) {
    return '0 из 0';
  }
  const safePageSize = pageSize > 0 ? pageSize : displayed;
  const start = page * safePageSize + 1;
  const end = Math.min(total, start + displayed - 1);
  return `${start}–${end} из ${total}`;
}

function getSearchTypeLabel(type: SearchType): string {
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
      return '—';
  }
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
