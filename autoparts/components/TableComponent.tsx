// component.tsx
'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { ShoppingCart, Plus, Minus, ContactRound, Info, InfoIcon } from 'lucide-react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Link from 'next/link';
import { useCartStore } from '@/lib/stores/cartStore';

function cn(...inputs: ClassValue[]) {
   return twMerge(clsx(inputs));
}

export interface AutoPart {
   id: string;
   brand: string;
   article: string;
   name: string;
   quantity: number;
   availability: number; // percentage
   warehouse: string;
   delivery: string;
   price: number;
   imageUrl: string;
}

// Интерфейс для результатов поиска из API
export interface SearchResult {
   id: number;
   code: string;
   name: string;
   brand: string;
   price: number;
   quantity: number;
   warehouse?: string;
   availability?: number;
   imageUrl?: string;
}

// Интерфейс для SearchItem из поисковой API
export interface SearchItem {
  oem: string;
  name: string;
  brand: string;
  catalog: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
  quantity?: number;
  warehouses?: SearchWarehouse[];
  unitId?: number;
  ssd?: string;
  categoryId?: number;
  vehicleHints?: string[];
}

export interface SearchWarehouse {
  code: string;
  name: string;
  address: string;
  qty: number;
}

const partImageUrl = (article: string) =>
  `https://placehold.co/80x60/EEE/666?text=${encodeURIComponent(article)}`;

// Меняет размер изображения Laximo в URL: /%size%/ или /{size}/
function laxSetSize(url: string, size: 'source' | '400' | '200'): string {
  if (!url) return url;
  if (url.includes('%size%')) return url.replace('%size%', size);
  return url.replace(/\/(source|\d{3})\//, `/${size}/`);
}

// Функция для конвертации результатов поиска в формат AutoPart
export const convertSearchResultToAutoPart = (result: SearchResult): AutoPart => ({
   id: result.id.toString(),
   brand: result.brand || 'N/A',
   article: result.code,
   name: result.name,
   quantity: result.quantity || 0,
   availability: result.availability || 95,
   warehouse: result.warehouse || 'Склад не указан',
   delivery: 'По запросу', // Можно добавить в API позже
   price: result.price || 0,
   imageUrl: result.imageUrl || partImageUrl(result.code),
});

// Функция для конвертации SearchItem в формат AutoPart
export const convertSearchItemToAutoPart = (item: SearchItem, index: number): AutoPart => {
  // Нормализуем URL из Laximo: используем превью 200
  let img = item.imageUrl || '';
  if (img) img = laxSetSize(img, '200');
  if (!img) img = partImageUrl(item.oem);
  return {
    id: item.oem?.trim() || `search-${index}`,
    brand: item.brand || 'N/A',
    article: item.oem,
    name: item.name,
    quantity: item.quantity || (item.warehouses?.reduce((sum, w) => sum + w.qty, 0) || 0),
    availability: 95,
    warehouse: item.warehouses?.[0]?.name || 'Склад не указан',
    delivery: 'По запросу',
    price: item.price || 0,
    imageUrl: img,
  };
};

export const autoParts: AutoPart[] = [
   {
      id: '1',
      brand: 'VOLVO',
      article: '21707132',
      name: 'масляный фильтр !by-pass \\Volvo FH12., FORD Cargo',
      quantity: 20,
      availability: 100,
      warehouse: 'Шымкент Толе Би',
      delivery: '28.07.25 19:00',
      price: 15360,
      imageUrl: partImageUrl('21707132'),
   },
   {
      id: '2',
      brand: 'VOLVO',
      article: '21707132',
      name: 'масляный фильтр !by-pass \\Volvo FH12., FORD Cargo',
      quantity: 3,
      availability: 98,
      warehouse: 'Костанай',
      delivery: '11.08.25 19:00',
      price: 15670,
      imageUrl: partImageUrl('21707132'),
   },
   {
      id: '3',
      brand: 'VOLVO',
      article: '21707132',
      name: 'Фильтр масляный VOLVO 21707132',
      quantity: 2,
      availability: 94,
      warehouse: 'ЦЗ Казань',
      delivery: '08.08.25 11.08.25',
      price: 9620,
      imageUrl: partImageUrl('21707132'),
   },
   {
      id: '4',
      brand: 'VOLVO',
      article: '21707132',
      name: 'МАСЛЯНЫЙ ФИЛЬТР !BY-PASS VOLVO FH12., FORD CARGO 21707132',
      quantity: 496,
      availability: 84,
      warehouse: 'ЦЗ Казань',
      delivery: '11.08.25 14.08.25',
      price: 11960,
      imageUrl: partImageUrl('21707132'),
   },
   {
      id: '5',
      brand: 'VOLVO',
      article: '21707132',
      name: 'Масляный фильтр BY-PASS Volvo',
      quantity: 65,
      availability: 95,
      warehouse: 'ЦЗ Ростов-на-Дону',
      delivery: '06.08.25 11.08.25',
      price: 16900,
      imageUrl: partImageUrl('21707132'),
   },
   {
      id: '6',
      brand: 'VOLVO',
      article: '21707132',
      name: 'Фильтр масляный BY PASS Volvo',
      quantity: 320,
      availability: 95,
      warehouse: 'ЦЗ Москва',
      delivery: '06.08.25 11.08.25',
      price: 22030,
      imageUrl: partImageUrl('21707132'),
   },
   {
      id: '7',
      brand: 'VOLVO',
      article: '21707132',
      name: 'Фильтр масляный 21707132',
      quantity: 20,
      availability: 81,
      warehouse: 'ЦЗ Шымкент',
      delivery: '29.07.25 01.08.25',
      price: 26570,
      imageUrl: partImageUrl('21707132'),
   },
];

function Avatar({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>) {
   return (
      <AvatarPrimitive.Root
         data-slot="avatar"
         className={cn('relative flex size-8 shrink-0 overflow-hidden rounded-full', className)}
         {...props}
      />
   );
}

function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
   return (
      <AvatarPrimitive.Image
         data-slot="avatar-image"
         className={cn('aspect-square size-full', className)}
         {...props}
      />
   );
}

function AvatarFallback({
   className,
   ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
   return (
      <AvatarPrimitive.Fallback
         data-slot="avatar-fallback"
         className={cn(
            'bg-muted flex size-full items-center justify-center rounded-full',
            className
         )}
         {...props}
      />
   );
}

function ImageModal({ src, onClose }: { src: string; onClose: () => void }) {
   const setSize = (u: string, size: 'source' | '400' | '200') => {
      if (!u) return u;
      if (u.includes('%size%')) return u.replace('%size%', size);
      return u.replace(/\/(source|\d{3})\//, `/${size}/`);
   };
   return (
      <div
         className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
         onClick={onClose}
      >
         <div onClick={(e) => e.stopPropagation()}>
            <img
               src={src}
               alt="full"
               className="max-w-xl max-h-xl rounded shadow-lg"
               onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  const tried = target.dataset.tried || '';
                  if (!tried.includes('400')) {
                     target.dataset.tried = (tried ? tried + ',' : '') + '400';
                     target.src = setSize(src, '400');
                     return;
                  }
                  if (!tried.includes('200')) {
                     target.dataset.tried = tried + ',200';
                     target.src = setSize(src, '200');
                  }
               }}
            />
         </div>
      </div>
   );
}




function TooltipProvider({
   delayDuration = 0,
   ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
   return (
      <TooltipPrimitive.Provider
         data-slot="tooltip-provider"
         delayDuration={delayDuration}
         {...props}
      />
   );
}

function Tooltip({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
   return (
      <TooltipProvider>
         <TooltipPrimitive.Root data-slot="tooltip" {...props} />
      </TooltipProvider>
   );
}

function TooltipTrigger({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
   return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
   className,
   sideOffset = 8,
   children,
   ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
   return (
      <TooltipPrimitive.Portal>
         <TooltipPrimitive.Content
            data-slot="tooltip-content"
            sideOffset={sideOffset}
            className={cn(
               'bg-background border text-muted-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit rounded-md px-3 py-1.5 text-xs text-balance',
               className
            )}
            {...props}
         >
            {children}
         </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
   );
}

// Заглушка для teams, так как этот код не используется в контексте автозапчастей
const teams: any[] = [];

interface TeamsTooltipProps {
   teamIds: string[];
}

function TeamsTooltip({ teamIds }: TeamsTooltipProps) {
   return null; // Временно отключаем, так как не используется
}

interface QuantityControlProps {
   initialQuantity?: number;
   maxQuantity: number;
   onQuantityChange: (quantity: number) => void;
}

function QuantityControl({ initialQuantity = 1, maxQuantity, onQuantityChange }: QuantityControlProps) {
   const [quantity, setQuantity] = useState(initialQuantity);

   const handleDecrease = () => {
      if (quantity > 1) {
         const newQuantity = quantity - 1;
         setQuantity(newQuantity);
         onQuantityChange(newQuantity);
      }
   };

   const handleIncrease = () => {
      if (quantity < maxQuantity) {
         const newQuantity = quantity + 1;
         setQuantity(newQuantity);
         onQuantityChange(newQuantity);
      }
   };

   return (
      <div className="flex items-center ">
         <button
            onClick={handleDecrease}
            disabled={quantity <= 1}
            className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
         >
            <Minus className="w-4 h-4" />
         </button>
         <span className="w-8 text-center font-medium">{quantity}</span>
         <button
            onClick={handleIncrease}
            disabled={quantity >= maxQuantity}
            className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
         >
            <Plus className="w-4 h-4" />
         </button>
      </div>
   );
}

interface AutoPartLineProps {
   part: AutoPart;
   onImageClick?: (src: string) => void;
}

function AutoPartLine({ part, onImageClick }: AutoPartLineProps) {
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const { add, addByOem } = useCartStore();

  const handleAddToCart = async () => {
      // Если id — это числовой productId, используем обычный add
      const numericId = Number(part.id);
      const isNumericId = !Number.isNaN(numericId) && Number.isFinite(numericId);
      try {
         if (isNumericId) {
            await add(numericId, selectedQuantity);
         } else {
            // Иначе добавляем по OEM/артикулу из строки поиска
            await addByOem(part.article, part.name, part.brand, selectedQuantity, part.price, part.imageUrl);
         }
      } catch (e) {
         // Ошибку обработает стор (error state). Здесь молчим.
      }
   };

   const getAvailabilityColor = (availability: number) => {
      if (availability >= 95) return 'text-green-600';
      if (availability >= 80) return 'text-yellow-600';
      return 'text-red-600';
   };

  const numericId = Number(part.id);
  const isNumericId = Number.isFinite(numericId);
  const href = isNumericId
    ? `/parts/${numericId}`
    : `/parts/${encodeURIComponent(part.article || part.id)}`;

   return (
      <div className="w-full flex items-center py-3 px-6 border-b hover:bg-sidebar/50 border-muted-foreground/5 text-sm last:border-b-0">
         <div className="w-20 shrink-0">
            <img
              src={part.imageUrl}
              alt={part.name}
              className="w-16 h-12 object-cover rounded border cursor-pointer hover:scale-105 transition-transform"
              onClick={() => {
                // открыть полноразмерную картинку (source)
                const full = laxSetSize(part.imageUrl, 'source');
                onImageClick?.(full);
              }}
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                const tried = target.dataset.tried || '';
                if (!tried.includes('200')) {
                  target.dataset.tried = (tried ? tried + ',' : '') + '200';
                  target.src = laxSetSize(target.src, '200');
                  return;
                }
                if (!tried.includes('source')) {
                  target.dataset.tried = tried + ',source';
                  target.src = laxSetSize(target.src, 'source');
                  return;
                }
                if (!tried.includes('placeholder')) {
                  target.dataset.tried = tried + ',placeholder';
                  target.src = partImageUrl(part.article);
                }
              }}
            />
         </div>
         <div className="w-24 shrink-0 font-medium">{part.brand}</div>
         
         <div className="w-32 shrink-0 font-mono text-xs text-blue-600">{part.article}</div>
         <div className="flex-grow px-2 overflow-hidden">
            <span className="truncate block">{part.name}</span>
            {isNumericId || part.article ? (
              <Link href={href} prefetch={false}>
                <Info className="mt-1 h-4 w-4 text-blue-600" />
              </Link>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="mt-1 inline-flex h-4 w-4 cursor-not-allowed items-center justify-center text-slate-300">
                    <Info className="h-4 w-4" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Подробная карточка недоступна</TooltipContent>
              </Tooltip>
            )}
         </div>
         <div className="w-20 shrink-0 text-center">
            <span
               className={`font-medium ${
                  part.quantity > 50
                     ? 'text-green-600'
                     : part.quantity > 10
                     ? 'text-yellow-600'
                     : 'text-red-600'
               }`}
            >
               {part.quantity > 20 ? '>20' : part.quantity}
            </span>
         </div>
         <div className="w-32 shrink-0">
            <div className="text-xs text-muted-foreground">{part.warehouse}</div>
            <div
               className={`text-xs font-medium ${getAvailabilityColor(part.availability)}`}
            >
               {part.availability}%
            </div>
         </div>
         <div className="w-32 shrink-0 text-xs text-muted-foreground">
            {part.delivery}
         </div>
         <div className="w-28 shrink-0 text-right font-medium">
            {part.price.toLocaleString()} ₸
         </div>
         <div className="w-40 shrink-0 flex items-center gap-2 justify-end">
            <QuantityControl
               maxQuantity={Math.min(part.quantity, 99)}
               onQuantityChange={setSelectedQuantity}
            />
            <button
               onClick={handleAddToCart}
               className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
               <ShoppingCart className="w-4 h-4" />
               
            </button>
         </div>
      </div>
   );
}



interface AutoPartsTableProps extends React.HTMLAttributes<HTMLDivElement> {
   parts?: AutoPart[];
   isLoading?: boolean;
   emptyMessage?: string;
}

const AutoPartsTable = React.forwardRef<
   HTMLDivElement,
   AutoPartsTableProps
>(({ className, parts = autoParts, isLoading = false, emptyMessage = "Товары не найдены", ...props }, ref) => {
   const [selectedImage, setSelectedImage] = useState<string | null>(null);

   if (isLoading) {
      return (
         <div className={cn('w-full h-full bg-white dark:bg-black flex items-center justify-center', className)}>
            <div className="text-center">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
               <p className="text-muted-foreground">Загрузка...</p>
            </div>
         </div>
      );
   }

   if (parts.length === 0) {
      return (
         <div className={cn('w-full h-full bg-white dark:bg-black flex items-center justify-center', className)}>
            <div className="text-center">
               <p className="text-muted-foreground text-lg">{emptyMessage}</p>
            </div>
         </div>
      );
   }

   return (
      <div
         ref={ref}
         className={cn(
            'w-full h-full bg-white dark:bg-black text-black dark:text-white transition-colors duration-300',
            className
         )}
         {...props}
      >
    

      <div className="bg-container px-6 py-3 text-sm flex items-center text-muted-foreground border-b sticky top-0 z-10 font-medium">
            <div className="w-20 shrink-0">Фото</div>
            <div className="w-24 shrink-0">Бренд</div>
            <div className="w-32 shrink-0">Артикул</div>
            <div className="flex-grow px-2">Наименование</div>
            <div className="w-20 shrink-0 text-center">Кол-во</div>
            <div className="w-32 shrink-0">Склад</div>
            <div className="w-32 shrink-0">Поставка</div>
            <div className="w-28 shrink-0 text-right">Цена</div>
            <div className="w-40 shrink-0 text-center">Действия</div>
         </div>
         <div className="w-full min-w-[1000px]">
            {parts.map((part) => (
               <AutoPartLine key={part.id} part={part} onImageClick={setSelectedImage} />
            ))}
         </div>

         {selectedImage && (
            <ImageModal src={selectedImage} onClose={() => setSelectedImage(null)} />
         )}
      </div>
   );
});
AutoPartsTable.displayName = 'AutoPartsTable';



export default AutoPartsTable;
