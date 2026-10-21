'use client';

import { XIcon } from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const PLACEHOLDER = '/images/product-placeholder.svg';

// битая картинка поставщика — плейсхолдер вместо обрезанного alt-текста
const fallbackToPlaceholder = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  if (!img.src.endsWith(PLACEHOLDER)) img.src = PLACEHOLDER;
};

interface ProductPhotoProps {
  src?: string | null;
  alt: string;
}

/** Миниатюра товара в таблице результатов; по клику открывает фото в модальном окне. */
export default function ProductPhoto({ src, alt }: ProductPhotoProps) {
  if (!src) {
    return (
      <div className="w-12 h-12 bg-gray-100 rounded mx-auto flex items-center justify-center">
        <span className="text-gray-400 text-xs">Нет фото</span>
      </div>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`Открыть фото: ${alt}`}
          className="block mx-auto rounded cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        >
          <img
            src={src}
            alt={alt}
            className="w-12 h-12 object-cover rounded overflow-hidden text-[0px] transition hover:opacity-80"
            onError={fallbackToPlaceholder}
          />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl bg-white p-4">
        <DialogTitle className="pr-8 text-base font-semibold text-gray-900">{alt}</DialogTitle>
        <DialogClose
          aria-label="Закрыть"
          className="absolute right-3 top-3 rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        >
          <XIcon className="h-5 w-5" />
        </DialogClose>
        <img
          src={src}
          alt={alt}
          className="mt-3 max-h-[75vh] w-full rounded object-contain"
          onError={fallbackToPlaceholder}
        />
      </DialogContent>
    </Dialog>
  );
}
