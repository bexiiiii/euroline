"use client";

import React, { useState, useEffect } from 'react';
import { DetailDto } from '@/lib/api/vehicle';
import { vehicleApi } from '@/lib/api/vehicle';

interface InteractivePartsDiagramProps {
  /** Детали узла */
  unitDetails: DetailDto[];
  /** URL изображения схемы */
  imageUrl: string;
  /** Название узла */
  unitName: string;
  /** Каталог */
  catalog: string;
  /** ID узла */
  unitId: number;
  /** SSD для API */
  ssd: string;
  /** Обратный вызов при наведении на деталь */
  onHoverChange?: (codeOnImage: string | null) => void;
  /** Текущий выделенный элемент */
  hoveredCode?: string | null;
}

interface ImageMapCoordinate {
  /** ID детали */
  detailId?: number;
  /** Код на изображении (номер) */
  callout: string;
  /** Координата X */
  x: number;
  /** Координата Y */  
  y: number;
  /** Ширина области */
  w: number;
  /** Высота области */
  h: number;
}

const InteractivePartsDiagram: React.FC<InteractivePartsDiagramProps> = ({
  unitDetails,
  imageUrl,
  unitName,
  catalog,
  unitId,
  ssd,
  onHoverChange,
  hoveredCode
}) => {
  const [coordinates, setCoordinates] = useState<ImageMapCoordinate[]>([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadingCoordinates, setLoadingCoordinates] = useState(true);

  // Загружаем координаты из API
  useEffect(() => {
    const loadCoordinates = async () => {
      try {
        console.log('🗺️ Загружаем координаты для узла:', unitId);
        setLoadingCoordinates(true);
        const imageMap = await vehicleApi.getUnitImageMap(catalog, unitId, ssd);
        console.log('🗺️ Получены координаты:', imageMap);
        setCoordinates(imageMap);
      } catch (error) {
        console.error('❌ Ошибка загрузки координат:', error);
        // В случае ошибки будем использовать координаты из allAttributes деталей
        const coordinatesFromDetails = extractCoordinatesFromDetails(unitDetails);
        setCoordinates(coordinatesFromDetails);
      } finally {
        setLoadingCoordinates(false);
      }
    };

    if (catalog && unitId && ssd) {
      loadCoordinates();
    }
  }, [catalog, unitId, ssd, unitDetails]);

  // Извлекаем координаты из allAttributes деталей как резерв
  const extractCoordinatesFromDetails = (details: DetailDto[]): ImageMapCoordinate[] => {
    return details
      .filter(detail => detail.codeOnImage && detail.allAttributes)
      .map(detail => {
        const attrs = detail.allAttributes!;
        if (attrs.imageX && attrs.imageY && attrs.imageW && attrs.imageH) {
          return {
            detailId: detail.detailId,
            callout: detail.codeOnImage!,
            x: parseInt(attrs.imageX),
            y: parseInt(attrs.imageY),
            w: parseInt(attrs.imageW),
            h: parseInt(attrs.imageH)
          };
        }
        return null;
      })
      .filter(Boolean) as ImageMapCoordinate[];
  };

  // Создаем карту координат по коду
  const coordinatesByCode = React.useMemo(() => {
    const map = new Map<string, ImageMapCoordinate>();
    coordinates.forEach(coord => {
      map.set(coord.callout, coord);
    });
    return map;
  }, [coordinates]);

  // Создаем карту деталей по коду
  const detailsByCode = React.useMemo(() => {
    const map = new Map<string, DetailDto>();
    unitDetails.forEach(detail => {
      if (detail.codeOnImage) {
        map.set(detail.codeOnImage, detail);
      }
    });
    return map;
  }, [unitDetails]);

  const handleHover = (codeOnImage: string | null) => {
    onHoverChange?.(codeOnImage);
  };

  return (
    <div className="relative aspect-[4/3] md:aspect-[5/4] bg-gray-50 rounded-lg overflow-hidden">
      {/* Панель подсказок */}
      <div className="absolute bottom-3 left-3 z-10 hidden md:flex gap-3 text-[11px] text-gray-600 bg-white/85 backdrop-blur px-2 py-1 rounded">
        <span>🖱️ Скролл — увелич./уменьш.</span>
        <span>🖱️ Перетаскивание — удерживая ЛКМ</span>
        <span>🔢 Наведение на номер — подсветка детали</span>
      </div>

      {/* Изображение схемы */}
      {imageUrl ? (
        <img
          src={imageUrl.replace('%size%', 'source')}
          alt={unitName}
          className="w-full h-full object-contain"
          onLoad={() => {
            console.log('✅ Изображение схемы загружено:', imageUrl);
            setImageLoaded(true);
          }}
          onError={(e) => {
            console.log('❌ Ошибка загрузки изображения схемы:', imageUrl);
            console.log('Пытаемся альтернативный размер...');
            // Пробуем другой размер
            const img = e.target as HTMLImageElement;
            if (img.src.includes('source')) {
              img.src = imageUrl.replace('%size%', '400');
            }
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#f4f4f5,transparent_55%),radial-gradient(circle_at_70%_80%,#f4f4f5,transparent_45%)] flex items-center justify-center">
          <p className="text-gray-500">Изображение недоступно</p>
        </div>
      )}

      {/* Интерактивные области деталей */}
      {imageLoaded && coordinates.map((coord) => {
        const detail = detailsByCode.get(coord.callout);
        if (!detail) return null;

        const isHovered = hoveredCode === coord.callout;
        
        return (
          <div key={coord.callout}>
            {/* Невидимая область для наведения */}
            <div
              className="absolute cursor-pointer"
              style={{
                left: `${(coord.x / (400)) * 100}%`, // Предполагаем базовый размер 400px
                top: `${(coord.y / (300)) * 100}%`,   // Предполагаем базовый размер 300px
                width: `${(coord.w / (400)) * 100}%`,
                height: `${(coord.h / (300)) * 100}%`,
              }}
              onMouseEnter={() => handleHover(coord.callout)}
              onMouseLeave={() => handleHover(null)}
              title={`${coord.callout}: ${detail.name}`}
            >
              {/* Подсветка области при наведении */}
              {isHovered && (
                <div className="absolute inset-0 bg-orange-400/30 border-2 border-orange-500 rounded animate-pulse" />
              )}
            </div>

            {/* Номер детали */}
            <div
              className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ${
                isHovered ? 'scale-125 z-20' : 'hover:scale-110 z-10'
              }`}
              style={{
                left: `${((coord.x + coord.w / 2) / 400) * 100}%`,
                top: `${((coord.y + coord.h / 2) / 300) * 100}%`,
              }}
              onMouseEnter={() => handleHover(coord.callout)}
              onMouseLeave={() => handleHover(null)}
            >
              <div className={`flex items-center justify-center w-6 h-6 rounded text-xs font-semibold shadow transition-colors ${
                isHovered 
                  ? 'bg-orange-500 text-white ring-2 ring-orange-300 ring-offset-2' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}>
                {coord.callout}
              </div>
              
              {/* Всплывающая подсказка */}
              {isHovered && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-30 pointer-events-none">
                  <div className="font-semibold">{detail.name}</div>
                  <div className="text-blue-200">OEM: {detail.oem}</div>
                  {detail.qty && <div className="text-green-200">Кол-во: {detail.qty} шт.</div>}
                  <div className="text-gray-300">Область: {coord.w}x{coord.h}px</div>
                  {/* Стрелочка */}
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black rotate-45"></div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Индикатор загрузки координат */}
      {loadingCoordinates && imageLoaded && (
        <div className="absolute top-3 right-3 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
          Загружаем координаты...
        </div>
      )}

      {/* Статистика для отладки */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-3 left-3 bg-black/80 text-white text-xs p-2 rounded">
          <div>Деталей: {unitDetails.length}</div>
          <div>Координат: {coordinates.length}</div>
          <div>С кодами: {unitDetails.filter(d => d.codeOnImage).length}</div>
          {hoveredCode && <div>Наведение: {hoveredCode}</div>}
        </div>
      )}
    </div>
  );
};

export default InteractivePartsDiagram;
