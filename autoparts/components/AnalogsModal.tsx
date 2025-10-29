'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Package, ShoppingCart, Loader2, MapPin } from 'lucide-react';
import { searchApi, type SearchItem, type BrandRefinementItem } from '@/lib/api/search';
import { useCartStore } from '@/lib/stores/cartStore';
import { toast } from 'sonner';

interface AnalogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: string;
  brandItems?: BrandRefinementItem[];
}

export default function AnalogsModal({ isOpen, onClose, article, brandItems }: AnalogsModalProps) {
  const [analogs, setAnalogs] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const { addByOem } = useCartStore();

  const uniqueBrands = useMemo(() => {
    if (!brandItems || brandItems.length === 0) return [];
    const brands = new Set<string>();
    brandItems.forEach((item) => {
      if (item.brand) {
        brands.add(item.brand);
      }
    });
    return Array.from(brands);
  }, [brandItems]);

  useEffect(() => {
    if (!isOpen) {
      setAnalogs([]);
      setSelectedBrand('');
      return;
    }

    const defaultBrand = uniqueBrands[0] ?? '';
    if (defaultBrand && defaultBrand !== selectedBrand) {
      setSelectedBrand(defaultBrand);
      void fetchAnalogs(article, defaultBrand);
    } else if (!defaultBrand) {
      void fetchAnalogs(article, '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, article, uniqueBrands.length]);

  const fetchAnalogs = async (art: string, brand: string) => {
    setLoading(true);
    try {
      const response = await searchApi.search(art);
      const items = (response.results || []).filter((item) => item.catalog === 'UMAPI_ANALOG');
      const filtered =
        brand && brand.trim().length > 0
          ? items.filter(
              (item) =>
                !item.brand || item.brand.toUpperCase() === brand.trim().toUpperCase()
            )
          : items;
      setAnalogs(filtered);
    } catch (error) {
      console.error('Failed to fetch analogs:', error);
      toast.error('Не удалось загрузить аналоги');
      setAnalogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    void fetchAnalogs(article, brand);
  };

  const handleAddToCart = async (item: SearchItem) => {
    const available = computeAvailableQuantity(item);
    if (available <= 0) {
      toast.error('Аналог отсутствует на складах');
      return;
    }
    try {
      await addByOem(
        item.oem,
        item.name,
        item.brand || 'UNKNOWN',
        1,
        item.price,
        item.imageUrl
      );
      toast.success('Товар добавлен в корзину');
    } catch (error: any) {
      console.error('Failed to add analog:', error);
      toast.error(error?.message || 'Не удалось добавить в корзину');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Аналоги запчасти</h2>
            <p className="text-sm text-gray-600 mt-1">
              Артикул: <span className="font-mono font-medium">{article}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            aria-label="Закрыть"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {uniqueBrands.length > 1 && (
          <div className="p-6 border-b bg-gray-50">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Выберите бренд:
            </label>
            <div className="flex flex-wrap gap-2">
              {uniqueBrands.map((brand) => (
                <button
                  key={brand}
                  onClick={() => handleBrandChange(brand)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                    selectedBrand === brand
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <span className="ml-3 text-gray-600">Загрузка аналогов...</span>
            </div>
          ) : analogs.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Аналоги не найдены</h3>
              <p className="text-gray-600">
                Для артикула {article}
                {selectedBrand ? ` (${selectedBrand})` : ''} аналоги не обнаружены
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
                Найдено {analogs.length} аналогов
              </h3>
              <div className="space-y-2">
                {analogs.map((analog) => (
                  <AnalogCard
                    key={`${analog.oem}-${analog.brand ?? 'analog'}`}
                    analog={analog}
                    onAddToCart={() => handleAddToCart(analog)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

function AnalogCard({ analog, onAddToCart }: { analog: SearchItem; onAddToCart: () => void }) {
  const available = computeAvailableQuantity(analog);

  return (
    <div className="flex flex-col md:flex-row items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="w-20 h-20 bg-gray-100 border border-gray-200 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
        {analog.imageUrl ? (
          <img
            src={ensureAbsoluteUrl(analog.imageUrl)}
            alt={analog.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Package className="w-8 h-8 text-gray-400" />
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-lg font-semibold text-gray-900">{analog.brand || 'Неизвестный бренд'}</h4>
            <div className="text-sm text-gray-600 font-mono">{analog.oem}</div>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
            Аналог
          </span>
        </div>

        <div className="text-sm text-gray-600">{analog.name}</div>

        <WarehouseSummary warehouses={analog.warehouses} total={available} />

        {typeof analog.price === 'number' ? (
          <div className="text-lg font-semibold text-gray-900">
            {formatPrice(analog.price)} {analog.currency || 'тг'}
          </div>
        ) : (
          <div className="text-sm text-gray-500">Цена по запросу</div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={onAddToCart}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition"
        >
          <ShoppingCart className="w-4 h-4" />
          В корзину
        </button>
      </div>
    </div>
  );
}

function WarehouseSummary({
  warehouses,
  total,
}: {
  warehouses?: SearchItem['warehouses'];
  total: number;
}) {
  if (!warehouses || warehouses.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <MapPin className="w-4 h-4 text-gray-400" />
        Нет складских данных
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
            <span className="truncate max-w-[160px]">{warehouse.name || warehouse.code}</span>
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

function ensureAbsoluteUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('/')) {
    return `https://api.umapi.ru${url}`;
  }
  return url;
}
