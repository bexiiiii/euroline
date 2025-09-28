"use client";

import React from "react";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { Banner } from "@/lib/api/promotions";
import { API_URL } from "@/lib/api";

interface ProductBannerCardProps {
  banner: Banner;
  onPreview: (banner: Banner) => void;
  onEdit: (banner: Banner) => void;
  onToggleStatus: (banner: Banner) => void;
  onDelete: (banner: Banner) => void;
}

const ProductBannerCard: React.FC<ProductBannerCardProps> = ({
  banner,
  onPreview,
  onEdit,
  onToggleStatus,
  onDelete,
}) => {
  const isActive = banner.status === "ACTIVE";

  return (
    <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-white/[0.06] dark:bg-white/[0.02]">
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-28 overflow-hidden rounded-xl border border-gray-100 bg-gray-100 dark:border-white/[0.05] dark:bg-white/[0.04]">
          {banner.imageUrl ? (
            <img
              src={banner.imageUrl.startsWith('http') ? banner.imageUrl : `${API_URL}${banner.imageUrl}`}
              alt={banner.title}
              className="h-full w-full object-cover"
              onError={(event) => {
                const target = event.target as HTMLImageElement;
                console.error('Ошибка загрузки изображения баннера:', target.src);
                // Попробовать резервный вариант с URL кодированием
                if (!target.src.includes('fallback')) {
                  // Get the base URL and path
                  const baseUrl = banner.imageUrl.startsWith('http') ? '' : API_URL;
                  const imagePath = banner.imageUrl.startsWith('http') ? 
                    banner.imageUrl.split('/files/')[1] : 
                    banner.imageUrl.replace('/files/', '');
                  
                  // Try with sanitized filename (spaces and special chars -> underscores)
                  const sanitizedPath = imagePath
                    .replace(/[^a-zA-Z0-9._-]/g, '_')
                    .replace(/_+/g, '_');
                  
                  target.src = `${baseUrl}/files/${sanitizedPath}?fallback=1`;
                } else {
                  // Если все еще не загружается, показать заглушку
                  target.style.opacity = "0.3";
                  target.style.display = "none";
                  target.nextElementSibling?.classList.remove('hidden');
                }
              }}
            />
          ) : null}
          <div className="flex h-full w-full items-center justify-center text-gray-400 hidden">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {banner.title || "Без названия"}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge color={isActive ? "success" : "light"}>
              {isActive ? "Активен" : "Выключен"}
            </Badge>
            {banner.link && (
              <Badge variant="light" color="info">
                Ссылка
              </Badge>
            )}
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Создан: {new Date(banner.createdAt).toLocaleString("ru-RU")}
            </span>
          </div>
          {banner.link && (
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {banner.link}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPreview(banner)}
          className="border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800 dark:border-white/[0.08] dark:text-gray-300"
        >
          Просмотр
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(banner)}
          className="border-gray-200 text-gray-600 hover:border-brand-500 hover:text-brand-600 dark:border-white/[0.08] dark:text-gray-300"
        >
          Изменить
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onToggleStatus(banner)}
          className="border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800 dark:border-white/[0.08] dark:text-gray-300"
        >
          {isActive ? "Выключить" : "Включить"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(banner)}
          className="border-red-200 text-red-500 hover:border-red-300 hover:bg-red-50 dark:border-red-900/40 dark:text-red-300"
        >
          Удалить
        </Button>
      </div>
    </div>
  );
};

export default ProductBannerCard;
