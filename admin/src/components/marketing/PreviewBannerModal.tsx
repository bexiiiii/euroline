"use client";
import React from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import { formatDateTime } from "@/lib/format";

interface ProductBanner {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  position: "header" | "sidebar" | "footer" | "popup" | "product-page";
  displayType: "image" | "text" | "mixed";
  startDate: string;
  endDate: string;
  status: "active" | "scheduled" | "paused" | "draft";
  priority: number;
  clickCount: number;
  impressionCount: number;
  ctr: number;
  targetAudience: string;
  createdBy: string;
  createdDate: string;
}

interface PreviewBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  bannerData: ProductBanner | null;
}

const statusLabels: Record<ProductBanner["status"], { label: string; color: React.ComponentProps<typeof Badge>["color"] }> = {
  active: { label: "Активен", color: "success" },
  scheduled: { label: "Запланирован", color: "info" },
  paused: { label: "Выключен", color: "light" },
  draft: { label: "Черновик", color: "light" },
};

const PreviewBannerModal: React.FC<PreviewBannerModalProps> = ({
  isOpen,
  onClose,
  bannerData,
}) => {
  if (!bannerData) return null;

  const status = statusLabels[bannerData.status] ?? statusLabels.paused;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" className="p-0">
      <div className="space-y-4 p-5">
        <div className="flex items-center gap-2 pr-12">
          <h2 className="truncate text-base font-semibold text-gray-800 dark:text-white/90">
            {bannerData.title || "Без названия"}
          </h2>
          <Badge size="sm" color={status.color}>
            {status.label}
          </Badge>
        </div>

        <div className="aspect-[3/1] w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
          <ImageWithFallback
            src={bannerData.imageUrl}
            alt={bannerData.title}
            className="h-full w-full object-cover"
            fallback={
              <div className="flex h-full w-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                Изображение недоступно
              </div>
            }
          />
        </div>

        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div className="min-w-0">
            <dt className="text-gray-500 dark:text-gray-400">Ссылка</dt>
            <dd className="truncate text-gray-800 dark:text-white/90">
              {bannerData.linkUrl ? (
                <a
                  href={bannerData.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  {bannerData.linkUrl}
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Создан</dt>
            <dd className="tabular-nums text-gray-800 dark:text-white/90">{formatDateTime(bannerData.createdDate)}</dd>
          </div>
        </dl>

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PreviewBannerModal;
