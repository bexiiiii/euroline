"use client";
import React from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";

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

interface ViewBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  bannerData: ProductBanner | null;
  onEdit: (banner: ProductBanner) => void;
  onPreview: (banner: ProductBanner) => void;
}

const ViewBannerModal: React.FC<ViewBannerModalProps> = ({
  isOpen,
  onClose,
  bannerData,
  onEdit,
  onPreview,
}) => {
  if (!bannerData) return null;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: "success" as const, label: "Активен" },
      scheduled: { color: "info" as const, label: "Запланирован" },
      paused: { color: "warning" as const, label: "Приостановлен" },
      draft: { color: "light" as const, label: "Черновик" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge color={config.color}>{config.label}</Badge>;
  };

  const getPositionBadge = (position: string) => {
    const positionConfig = {
      header: { color: "info" as const, label: "Шапка" },
      sidebar: { color: "primary" as const, label: "Боковая панель" },
      footer: { color: "light" as const, label: "Подвал" },
      popup: { color: "error" as const, label: "Всплывающее" },
      "product-page": { color: "success" as const, label: "Страница товара" }
    };
    
    const config = positionConfig[position as keyof typeof positionConfig] || positionConfig.header;
    return <Badge color={config.color}>{config.label}</Badge>;
  };

  const getDisplayTypeBadge = (displayType: string) => {
    const typeConfig = {
      image: { color: "primary" as const, label: "Изображение" },
      text: { color: "info" as const, label: "Текст" },
      mixed: { color: "success" as const, label: "Смешанный" }
    };
    
    const config = typeConfig[displayType as keyof typeof typeConfig] || typeConfig.mixed;
    return <Badge color={config.color}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: number) => {
    const priorityConfig = {
      1: { color: "error" as const, label: "Высокий" },
      2: { color: "warning" as const, label: "Средний" },
      3: { color: "light" as const, label: "Низкий" }
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig[2];
    return <Badge color={config.color}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  const isActive = bannerData.status === 'active';
  const isScheduled = bannerData.status === 'scheduled';
  const now = new Date();
  const startDate = new Date(bannerData.startDate);
  const endDate = new Date(bannerData.endDate);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
    >
      <div className="p-6">
        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Информация о баннере
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Подробная информация и статистика баннера
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {getStatusBadge(bannerData.status)}
              {getPositionBadge(bannerData.position)}
              {getDisplayTypeBadge(bannerData.displayType)}
              {getPriorityBadge(bannerData.priority)}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Основная информация
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Заголовок
                </label>
                <p className="text-gray-900 dark:text-white font-medium">
                  {bannerData.title}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  ID баннера
                </label>
                <p className="text-gray-900 dark:text-white">
                  #{bannerData.id}
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Описание
                </label>
                <p className="text-gray-900 dark:text-white">
                  {bannerData.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Целевая аудитория
                </label>
                <p className="text-gray-900 dark:text-white">
                  {bannerData.targetAudience}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Создан
                </label>
                <p className="text-gray-900 dark:text-white">
                  {bannerData.createdBy} • {formatDate(bannerData.createdDate)}
                </p>
              </div>
            </div>
          </div>

          {/* Media and Links */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Медиа и ссылки
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(bannerData.displayType === "image" || bannerData.displayType === "mixed") && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Изображение
                  </label>
                  <div className="aspect-video w-full max-w-xs bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <img
                      src={bannerData.imageUrl}
                      alt={bannerData.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/images/placeholder.png";
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-all">
                    {bannerData.imageUrl}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Ссылка баннера
                </label>
                <a
                  href={bannerData.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                >
                  {bannerData.linkUrl}
                </a>
              </div>
            </div>
          </div>

          {/* Display Settings */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Настройки отображения
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Позиция
                </label>
                <div className="flex items-center space-x-2">
                  {getPositionBadge(bannerData.position)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Тип отображения
                </label>
                <div className="flex items-center space-x-2">
                  {getDisplayTypeBadge(bannerData.displayType)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Приоритет
                </label>
                <div className="flex items-center space-x-2">
                  {getPriorityBadge(bannerData.priority)}
                </div>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Расписание показа
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Дата и время начала
                </label>
                <p className="text-gray-900 dark:text-white">
                  {formatDate(bannerData.startDate)}
                </p>
                {isScheduled && startDate > now && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    Запуск через {Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} дн.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Дата и время окончания
                </label>
                <p className="text-gray-900 dark:text-white">
                  {formatDate(bannerData.endDate)}
                </p>
                {isActive && endDate > now && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    Осталось {Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} дн.
                  </p>
                )}
                {endDate < now && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    Истек {Math.abs(Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))} дн. назад
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Performance Stats */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Статистика эффективности
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatNumber(bannerData.impressionCount)}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  Показы
                </p>
              </div>

              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatNumber(bannerData.clickCount)}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  Клики
                </p>
              </div>

              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {bannerData.ctr.toFixed(2)}%
                </p>
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                  CTR
                </p>
              </div>

              <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {bannerData.impressionCount > 0 ? (bannerData.clickCount / bannerData.impressionCount * 100).toFixed(1) : "0.0"}%
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                  Конверсия
                </p>
              </div>
            </div>

            {bannerData.impressionCount === 0 && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  📊 Статистика пока недоступна. Данные появятся после первых показов баннера.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPreview(bannerData)}
              >
                👁️ Предпросмотр
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onEdit(bannerData)}
              >
                ✏️ Редактировать
              </Button>
            </div>
            
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ViewBannerModal;
