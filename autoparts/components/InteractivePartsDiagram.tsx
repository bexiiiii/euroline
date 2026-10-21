"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
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
  /** SSD узла для API */
  ssd: string;
  /** Наведение на номер на схеме */
  onHoverChange?: (codeOnImage: string | null) => void;
  /** Клик по номеру на схеме */
  onSelect?: (codeOnImage: string) => void;
  /** Текущий выделенный номер (из списка или со схемы) */
  hoveredCode?: string | null;
}

interface ImageMapCoordinate {
  callout: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;

/**
 * Схема узла с кликабельными номерами (Laximo ListImageMapByUnit), зумом и перетаскиванием.
 * Координаты приходят в пикселях исходного изображения, поэтому зоны
 * позиционируются в процентах от naturalWidth/naturalHeight картинки
 * и масштабируются вместе с ней.
 */
const InteractivePartsDiagram: React.FC<InteractivePartsDiagramProps> = ({
  unitDetails,
  imageUrl,
  unitName,
  catalog,
  unitId,
  ssd,
  onHoverChange,
  onSelect,
  hoveredCode,
}) => {
  const [coordinates, setCoordinates] = useState<ImageMapCoordinate[]>([]);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [loadingCoordinates, setLoadingCoordinates] = useState(true);
  const [src, setSrc] = useState(imageUrl.replace('%size%', 'source'));

  // Зум и сдвиг
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const drag = useRef<{ startX: number; startY: number; x: number; y: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    setSrc(imageUrl.replace('%size%', 'source'));
    setNatural(null);
    setView({ scale: 1, x: 0, y: 0 });
  }, [imageUrl]);

  // Картинка из кэша браузера может загрузиться до гидрации — тогда onLoad не сработает
  const captureNaturalSize = useCallback(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    }
  }, []);

  useEffect(() => {
    captureNaturalSize();
  }, [src, captureNaturalSize]);

  // Координаты номеров — один запрос на узел (кешируется на бэкенде)
  useEffect(() => {
    if (!catalog || !unitId || !ssd) return;
    let cancelled = false;
    setLoadingCoordinates(true);
    vehicleApi
      .getUnitImageMap(catalog, unitId, ssd)
      .then((map) => {
        if (!cancelled) setCoordinates((map || []) as ImageMapCoordinate[]);
      })
      .catch((error) => {
        console.error('Ошибка загрузки координат схемы:', error);
        if (!cancelled) setCoordinates([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCoordinates(false);
      });
    return () => {
      cancelled = true;
    };
  }, [catalog, unitId, ssd]);

  const detailsByCode = useMemo(() => {
    const map = new Map<string, DetailDto[]>();
    unitDetails.forEach((detail) => {
      if (!detail.codeOnImage) return;
      const list = map.get(detail.codeOnImage) ?? [];
      list.push(detail);
      map.set(detail.codeOnImage, list);
    });
    return map;
  }, [unitDetails]);

  // Не даём увести схему за край
  const clampView = useCallback((scale: number, x: number, y: number) => {
    const el = viewportRef.current;
    if (!el) return { scale, x, y };
    const w = el.clientWidth;
    const h = el.clientHeight;
    return {
      scale,
      x: Math.min(0, Math.max(w - w * scale, x)),
      y: Math.min(0, Math.max(h - h * scale, y)),
    };
  }, []);

  // Зум относительно точки (px, py) внутри области просмотра
  const zoomAt = useCallback(
    (factor: number, px?: number, py?: number) => {
      setView((v) => {
        const el = viewportRef.current;
        const cx = px ?? (el ? el.clientWidth / 2 : 0);
        const cy = py ?? (el ? el.clientHeight / 2 : 0);
        const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale * factor));
        const k = scale / v.scale;
        return clampView(scale, cx - (cx - v.x) * k, cy - (cy - v.y) * k);
      });
    },
    [clampView]
  );

  // Колесо мыши: нужен non-passive слушатель, чтобы не прокручивать страницу
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      zoomAt(e.deltaY < 0 ? 1.2 : 1 / 1.2, e.clientX - rect.left, e.clientY - rect.top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (view.scale <= 1 || e.button !== 0) return;
    drag.current = { startX: e.clientX, startY: e.clientY, x: view.x, y: view.y, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.abs(dx) + Math.abs(dy) > 3) {
      d.moved = true;
      // захватываем указатель только когда началось перетаскивание, чтобы клики по номерам работали
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    if (!d.moved) return;
    setView((v) => clampView(v.scale, d.x + dx, d.y + dy));
  };

  const onPointerUp = () => {
    suppressClick.current = !!drag.current?.moved;
    drag.current = null;
  };

  const isZoomed = view.scale > 1;

  return (
    <div className="flex flex-col items-center">
      <div
        ref={viewportRef}
        className={`relative inline-block max-w-full overflow-hidden touch-none ${
          isZoomed ? (drag.current ? 'cursor-grabbing' : 'cursor-grab') : ''
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={(e) => {
          const rect = viewportRef.current!.getBoundingClientRect();
          zoomAt(isZoomed ? 1 / view.scale : 2, e.clientX - rect.left, e.clientY - rect.top);
        }}
      >
        <div
          className="relative"
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            transformOrigin: '0 0',
            transition: drag.current ? 'none' : 'transform 120ms ease-out',
          }}
        >
          <img
            ref={imgRef}
            src={src}
            alt={unitName}
            className="block max-w-full w-auto h-auto max-h-[calc(100vh-12rem)] select-none pointer-events-none"
            draggable={false}
            onLoad={captureNaturalSize}
            onError={() => {
              if (src.includes('source')) setSrc(imageUrl.replace('%size%', '400'));
            }}
          />

          {natural &&
            coordinates.map((coord, i) => {
              const details = detailsByCode.get(coord.callout);
              const isActive = hoveredCode === coord.callout;
              return (
                <button
                  type="button"
                  key={`${coord.callout}-${i}`}
                  className={`absolute rounded-sm transition-colors ${
                    isActive
                      ? 'bg-orange-400/40 ring-2 ring-orange-500'
                      : details
                        ? 'hover:bg-orange-300/30 hover:ring-1 hover:ring-orange-400'
                        : ''
                  }`}
                  style={{
                    left: `${(coord.x / natural.w) * 100}%`,
                    top: `${(coord.y / natural.h) * 100}%`,
                    width: `${(coord.w / natural.w) * 100}%`,
                    height: `${(coord.h / natural.h) * 100}%`,
                  }}
                  onMouseEnter={() => onHoverChange?.(coord.callout)}
                  onMouseLeave={() => onHoverChange?.(null)}
                  onClick={() => {
                    if (suppressClick.current) {
                      suppressClick.current = false;
                      return;
                    }
                    onSelect?.(coord.callout);
                  }}
                  aria-label={details ? `${coord.callout}: ${details[0].name}` : coord.callout}
                >
                  {isActive && details && (
                    <span
                      className="absolute top-full left-1/2 mt-1 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-30 pointer-events-none text-left"
                      style={{ transform: `translateX(-50%) scale(${1 / view.scale})`, transformOrigin: 'top center' }}
                    >
                      <span className="block font-semibold">{details[0].name}</span>
                      <span className="block text-blue-200">{details.map((d) => d.oem).join(', ')}</span>
                    </span>
                  )}
                </button>
              );
            })}
        </div>

        {/* Управление зумом */}
        <div className="absolute top-2 right-2 z-40 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => zoomAt(1.5)}
            disabled={view.scale >= MAX_SCALE}
            className="w-8 h-8 flex items-center justify-center rounded bg-white/90 shadow border hover:bg-white disabled:opacity-40"
            aria-label="Увеличить"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => zoomAt(1 / 1.5)}
            disabled={!isZoomed}
            className="w-8 h-8 flex items-center justify-center rounded bg-white/90 shadow border hover:bg-white disabled:opacity-40"
            aria-label="Уменьшить"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setView({ scale: 1, x: 0, y: 0 })}
            disabled={!isZoomed}
            className="w-8 h-8 flex items-center justify-center rounded bg-white/90 shadow border hover:bg-white disabled:opacity-40"
            aria-label="Сбросить масштаб"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="mt-2 text-xs text-gray-500 text-center">
        {loadingCoordinates
          ? 'Загружаем разметку схемы…'
          : coordinates.length > 0
            ? 'Наведите на номер — деталь подсветится в списке. Колесо мыши или двойной клик — масштаб, перетаскивание — сдвиг'
            : 'Для этой схемы каталог не даёт разметку номеров — подсветка деталей недоступна. Колесо мыши или двойной клик — масштаб'}
      </p>
    </div>
  );
};

export default InteractivePartsDiagram;
