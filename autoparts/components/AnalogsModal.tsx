'use client';

import React, { useState, useEffect } from 'react';
import { X, Package, ShoppingCart, Loader2 } from 'lucide-react';
import { searchApi, type AnalogItem, type BrandRefinementItem } from '@/lib/api/search';
import { useCartStore } from '@/lib/stores/cartStore';
import { toast } from 'sonner';

interface AnalogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: string;
  brandItems?: BrandRefinementItem[]; // теперь это массив запчастей разных брендов
}

export default function AnalogsModal({ isOpen, onClose, article, brandItems }: AnalogsModalProps) {
  const [analogs, setAnalogs] = useState<AnalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const { addByOem } = useCartStore();

  // Получаем уникальные бренды из brandItems
  const uniqueBrands = React.useMemo(() => {
    if (!brandItems || brandItems.length === 0) return [];
    const brandsSet = new Set<string>();
    brandItems.forEach(item => brandsSet.add(item.brand));
    return Array.from(brandsSet);
  }, [brandItems]);

  useEffect(() => {
    if (isOpen && uniqueBrands.length > 0) {
      // По умолчанию выбираем первый бренд
      const defaultBrand = uniqueBrands[0];
      
      if (defaultBrand) {
        setSelectedBrand(defaultBrand);
        fetchAnalogs(article, defaultBrand);
      }
    }
  }, [isOpen, article, uniqueBrands]);

  const fetchAnalogs = async (article: string, brand: string) => {
    setLoading(true);
    try {
      const response = await searchApi.getAnalogs(article, brand);
      setAnalogs(response || []);
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
    fetchAnalogs(article, brand);
  };

  const handleAddToCart = async (analog: AnalogItem) => {
    try {
      await addByOem(
        analog.articleNumber,
        analog.name || analog.articleNumber,
        analog.supplierName,
        1,
        undefined,
        undefined
      );
      toast.success('Товар добавлен в корзину');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error('Не удалось добавить товар в корзину');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
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
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Brand Selector */}
        {uniqueBrands && uniqueBrands.length > 1 && (
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <span className="ml-3 text-gray-600">Загрузка аналогов...</span>
            </div>
          ) : analogs.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Аналоги не найдены
              </h3>
              <p className="text-gray-600">
                Для артикула {article} ({selectedBrand}) аналоги не обнаружены
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
                Найдено {analogs.length} аналогов
              </h3>
              <div className="space-y-2">
                {analogs.map((analog, index) => (
                  <AnalogCard
                    key={`${analog.articleNumber}-${index}`}
                    analog={analog}
                    onAddToCart={() => handleAddToCart(analog)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
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

interface AnalogCardProps {
  analog: AnalogItem;
  onAddToCart: () => void;
}

function AnalogCard({ analog, onAddToCart }: AnalogCardProps) {
  const getMatchTypeBadge = (matchType: string) => {
    switch (matchType?.toUpperCase()) {
      case 'OE':
        return <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">OE оригинал</span>;
      case 'OEM':
        return <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">OEM</span>;
      case 'SIMILAR':
        return <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded">Аналог</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">{matchType}</span>;
    }
  };

  const getQualityBadge = (quality?: string) => {
    if (!quality) return null;
    
    switch (quality?.toUpperCase()) {
      case 'OEM':
        return <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">OEM качество</span>;
      case 'AFTERMARKET':
        return <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">Aftermarket</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">{quality}</span>;
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-mono font-medium text-gray-900">
            {analog.articleNumber}
          </span>
          <span className="text-sm text-gray-600">
            {analog.supplierName}
          </span>
        </div>
        
        {analog.name && (
          <p className="text-sm text-gray-600 mb-2">{analog.name}</p>
        )}
        
        <div className="flex flex-wrap gap-2">
          {getMatchTypeBadge(analog.matchType)}
          {getQualityBadge(analog.quality)}
          {analog.available && (
            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
              В наличии
            </span>
          )}
        </div>
      </div>

      <button
        onClick={onAddToCart}
        className="ml-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition whitespace-nowrap"
      >
        <ShoppingCart className="w-4 h-4" />
        В корзину
      </button>
    </div>
  );
}
