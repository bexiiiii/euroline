"use client";
import React, { useState } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";
import ImageWithFallback from "@/components/common/ImageWithFallback";

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

const PreviewBannerModal: React.FC<PreviewBannerModalProps> = ({
  isOpen,
  onClose,
  bannerData,
}) => {
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [showMobile, setShowMobile] = useState(false);

  if (!bannerData) return null;

  const positions = [
    { value: "header", label: "Шапка сайта" },
    { value: "sidebar", label: "Боковая панель" },
    { value: "footer", label: "Подвал" },
    { value: "popup", label: "Всплывающее окно" },
    { value: "product-page", label: "Страница товара" }
  ];

  const currentPosition = selectedPosition || bannerData.position;

  const BannerPreview = ({ className = "" }: { className?: string }) => {
    const renderBannerContent = () => {
      switch (bannerData.displayType) {
        case "image":
          return (
            <div className={`banner-preview ${className}`}>
              <ImageWithFallback
                src={bannerData.imageUrl}
                alt={bannerData.title}
                className="w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              />
            </div>
          );

        case "text":
          return (
            <div className={`banner-preview text-banner p-4 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors ${className}`}>
              <h3 className="font-semibold text-lg mb-2">{bannerData.title}</h3>
              <p className="text-sm opacity-90">{bannerData.description}</p>
            </div>
          );

        case "mixed":
        default:
          return (
            <div className={`banner-preview mixed-banner border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 ${className}`}>
              <div className="flex">
                <div className="flex-shrink-0 w-32 h-24">
                  <ImageWithFallback
                    src={bannerData.imageUrl}
                    alt={bannerData.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 p-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                    {bannerData.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {bannerData.description}
                  </p>
                </div>
              </div>
            </div>
          );
      }
    };

    return renderBannerContent();
  };

  const MockupPreview = () => {
    const containerClass = showMobile ? "w-80" : "w-full max-w-4xl";
    
    return (
      <div className={`mockup-container ${containerClass} mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden`}>
        {/* Header */}
        <div className="mockup-header bg-gray-100 dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              AutoParts Store
            </div>
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
          </div>
          
          {/* Header Banner */}
          {currentPosition === "header" && (
            <div className="mt-4">
              <BannerPreview />
            </div>
          )}
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-1/4 bg-gray-50 dark:bg-gray-800 p-4 border-r border-gray-200 dark:border-gray-700 min-h-96">
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Категории</div>
              <div className="space-y-2">
                {["Двигатель", "Тормоза", "Подвеска", "Электрика"].map((category) => (
                  <div key={category} className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-600">
                    {category}
                  </div>
                ))}
              </div>
              
              {/* Sidebar Banner */}
              {currentPosition === "sidebar" && (
                <div className="mt-6">
                  <BannerPreview />
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4">
            <div className="space-y-4">
              <div className="text-xl font-semibold text-gray-900 dark:text-white">
                Популярные товары
              </div>
              
              {/* Product Grid */}
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Товар {item}</div>
                    <div className="text-sm text-gray-500">1 500 ₽</div>
                  </div>
                ))}
              </div>

              {/* Product Page Banner */}
              {currentPosition === "product-page" && (
                <div className="mt-6">
                  <BannerPreview />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mockup-footer bg-gray-100 dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            © 2025 Euroline. Все права защищены.
          </div>
          
          {/* Footer Banner */}
          {currentPosition === "footer" && (
            <div className="mt-4">
              <BannerPreview />
            </div>
          )}
        </div>

        {/* Popup Banner */}
        {currentPosition === "popup" && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4 relative">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
                ✕
              </button>
              <BannerPreview />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
    >
      <div className="p-6 h-full flex flex-col">
        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Предпросмотр баннера
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Как баннер будет выглядеть на сайте в различных позициях
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Position Selector */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Позиция:
                </label>
                <select
                  value={selectedPosition || bannerData.position}
                  onChange={(e) => setSelectedPosition(e.target.value)}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {positions.map((pos) => (
                    <option key={pos.value} value={pos.value}>
                      {pos.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Device Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowMobile(false)}
                  className={`px-3 py-1 text-sm rounded ${
                    !showMobile
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  🖥️ Десктоп
                </button>
                <button
                  onClick={() => setShowMobile(true)}
                  className={`px-3 py-1 text-sm rounded ${
                    showMobile
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  📱 Мобильный
                </button>
              </div>
            </div>
          </div>

          {/* Banner Info */}
          <div className="mt-4 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {bannerData.title}
              </span>
              <Badge color="info">
                {positions.find(p => p.value === currentPosition)?.label}
              </Badge>
              <Badge color={bannerData.displayType === "mixed" ? "success" : bannerData.displayType === "image" ? "primary" : "info"}>
                {bannerData.displayType === "mixed" ? "Смешанный" : bannerData.displayType === "image" ? "Изображение" : "Текст"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="relative">
            <MockupPreview />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              💡 Совет: Используйте разные позиции для тестирования эффективности баннера
            </div>
            
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Закрыть предпросмотр
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PreviewBannerModal;
