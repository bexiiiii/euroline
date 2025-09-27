"use client";
import React, { useState, useEffect } from "react";
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

interface EditBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  bannerData: ProductBanner | null;
  onSave: (bannerId: number, bannerData: any) => void;
}

const EditBannerModal: React.FC<EditBannerModalProps> = ({
  isOpen,
  onClose,
  bannerData,
  onSave,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [position, setPosition] = useState<"header" | "sidebar" | "footer" | "popup" | "product-page">("header");
  const [displayType, setDisplayType] = useState<"image" | "text" | "mixed">("mixed");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [priority, setPriority] = useState(2);
  const [targetAudience, setTargetAudience] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const isEditMode = !!bannerData?.id && bannerData.id > 0;

  useEffect(() => {
    if (bannerData && isOpen) {
      setTitle(bannerData.title);
      setDescription(bannerData.description);
      setImageUrl(bannerData.imageUrl);
      setLinkUrl(bannerData.linkUrl);
      setPosition(bannerData.position);
      setDisplayType(bannerData.displayType);
      setStartDate(new Date(bannerData.startDate).toISOString().slice(0, 16));
      setEndDate(new Date(bannerData.endDate).toISOString().slice(0, 16));
      setPriority(bannerData.priority);
      setTargetAudience(bannerData.targetAudience);
    } else if (!isEditMode && isOpen) {
      setTitle("");
      setDescription("");
      setImageUrl("");
      setLinkUrl("");
      setPosition("header");
      setDisplayType("mixed");
      setStartDate("");
      setEndDate("");
      setPriority(2);
      setTargetAudience("");
    }
    setErrors({});
  }, [bannerData, isEditMode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) {
      newErrors.title = "Введите заголовок баннера";
    }

    if (!description.trim()) {
      newErrors.description = "Введите описание баннера";
    }

    if (displayType === "image" || displayType === "mixed") {
      if (!imageUrl.trim()) {
        newErrors.imageUrl = "Введите URL изображения";
      }
    }

    if (!linkUrl.trim()) {
      newErrors.linkUrl = "Введите ссылку баннера";
    }

    if (!startDate) {
      newErrors.startDate = "Выберите дату начала";
    }

    if (!endDate) {
      newErrors.endDate = "Выберите дату окончания";
    }

    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      newErrors.endDate = "Дата окончания должна быть позже даты начала";
    }

    if (!targetAudience.trim()) {
      newErrors.targetAudience = "Укажите целевую аудиторию";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const bannerDataToSave = {
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim(),
        linkUrl: linkUrl.trim(),
        position,
        displayType,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        priority,
        targetAudience: targetAudience.trim(),
        status: isEditMode ? bannerData?.status : "draft"
      };

      await onSave(bannerData?.id || 0, bannerDataToSave);
      onClose();
    } catch (error) {
      console.error("Ошибка при сохранении баннера:", error);
    } finally {
      setLoading(false);
    }
  };

  const positionOptions = [
    { value: "header", label: "Шапка сайта" },
    { value: "sidebar", label: "Боковая панель" },
    { value: "footer", label: "Подвал" },
    { value: "popup", label: "Всплывающее окно" },
    { value: "product-page", label: "Страница товара" }
  ];

  const displayTypeOptions = [
    { value: "image", label: "Только изображение" },
    { value: "text", label: "Только текст" },
    { value: "mixed", label: "Изображение + текст" }
  ];

  if (!bannerData && !isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
    >
      <div className="p-6">
        {/* Modal Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEditMode ? "Редактирование баннера" : "Создание нового баннера"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isEditMode ? "Изменение параметров существующего баннера" : "Настройка нового рекламного баннера"}
          </p>
        </div>

        <div className="space-y-6">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Заголовок баннера *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) {
                      setErrors(prev => ({ ...prev, title: "" }));
                    }
                  }}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                    errors.title 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Введите заголовок баннера"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Описание баннера *
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description) {
                      setErrors(prev => ({ ...prev, description: "" }));
                    }
                  }}
                  rows={3}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                    errors.description 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Описание баннера для пользователей"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
                )}
              </div>
            </div>

            {/* Display Settings */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Настройки отображения
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="position" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Позиция на сайте *
                  </label>
                  <select
                    id="position"
                    value={position}
                    onChange={(e) => setPosition(e.target.value as any)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    {positionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="displayType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Тип отображения *
                  </label>
                  <select
                    id="displayType"
                    value={displayType}
                    onChange={(e) => setDisplayType(e.target.value as any)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    {displayTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Приоритет
                  </label>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value={1}>Высокий</option>
                    <option value={2}>Средний</option>
                    <option value={3}>Низкий</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Media and Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(displayType === "image" || displayType === "mixed") && (
                <div>
                  <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    URL изображения *
                  </label>
                  <input
                    type="url"
                    id="imageUrl"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      if (errors.imageUrl) {
                        setErrors(prev => ({ ...prev, imageUrl: "" }));
                      }
                    }}
                    required={displayType === "image" || displayType === "mixed"}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                      errors.imageUrl 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="https://example.com/image.jpg"
                  />
                  {errors.imageUrl && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.imageUrl}</p>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="linkUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ссылка баннера *
                </label>
                <input
                  type="url"
                  id="linkUrl"
                  value={linkUrl}
                  onChange={(e) => {
                    setLinkUrl(e.target.value);
                    if (errors.linkUrl) {
                      setErrors(prev => ({ ...prev, linkUrl: "" }));
                    }
                  }}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                    errors.linkUrl 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="https://example.com/page"
                />
                {errors.linkUrl && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.linkUrl}</p>
                )}
              </div>
            </div>

            {/* Dates and Audience */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Дата начала *
                </label>
                <input
                  type="datetime-local"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (errors.startDate) {
                      setErrors(prev => ({ ...prev, startDate: "" }));
                    }
                  }}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                    errors.startDate 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.startDate}</p>
                )}
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Дата окончания *
                </label>
                <input
                  type="datetime-local"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    if (errors.endDate) {
                      setErrors(prev => ({ ...prev, endDate: "" }));
                    }
                  }}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                    errors.endDate 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.endDate}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Целевая аудитория *
                </label>
                <input
                  type="text"
                  id="targetAudience"
                  value={targetAudience}
                  onChange={(e) => {
                    setTargetAudience(e.target.value);
                    if (errors.targetAudience) {
                      setErrors(prev => ({ ...prev, targetAudience: "" }));
                    }
                  }}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                    errors.targetAudience 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Например: Все пользователи, Владельцы авто, Новые клиенты"
                />
                {errors.targetAudience && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.targetAudience}</p>
                )}
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Опишите целевую аудиторию для отображения баннера
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Отменить
              </button>
              <Button
                variant="primary"
                size="sm"
                disabled={loading}
              >
                {loading ? "Сохранение..." : isEditMode ? "Сохранить изменения" : "Создать баннер"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
};

export default EditBannerModal;
