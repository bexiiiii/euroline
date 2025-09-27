"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";

interface ProductPromotion {
  id: number;
  name: string;
  description: string;
  discountType: "percentage" | "fixed" | "bogo";
  discountValue: number;
  startDate: string;
  endDate: string;
  status: "active" | "scheduled" | "paused" | "draft";
  productsCount: number;
  currentOrders: number;
  estimatedRevenue: number;
  actualRevenue: number;
  conversionRate: number;
  priority: "high" | "medium" | "low";
  createdBy: string;
  createdDate: string;
}

interface EditPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  promotionData: ProductPromotion | null;
  onSave: (promotionId: number, promotionData: any) => void;
}

const EditPromotionModal: React.FC<EditPromotionModalProps> = ({
  isOpen,
  onClose,
  promotionData,
  onSave,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed" | "bogo">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [estimatedRevenue, setEstimatedRevenue] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const isEditMode = !!promotionData?.id && promotionData.id > 0;

  useEffect(() => {
    if (promotionData && isOpen) {
      setName(promotionData.name);
      setDescription(promotionData.description);
      setDiscountType(promotionData.discountType);
      setDiscountValue(promotionData.discountValue.toString());
      setStartDate(new Date(promotionData.startDate).toISOString().slice(0, 16));
      setEndDate(new Date(promotionData.endDate).toISOString().slice(0, 16));
      setPriority(promotionData.priority);
      setEstimatedRevenue(promotionData.estimatedRevenue.toString());
    } else if (!isEditMode && isOpen) {
      setName("");
      setDescription("");
      setDiscountType("percentage");
      setDiscountValue("");
      setStartDate("");
      setEndDate("");
      setPriority("medium");
      setEstimatedRevenue("");
    }
    setErrors({});
  }, [promotionData, isEditMode, isOpen]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = "Введите название акции";
    }

    if (!description.trim()) {
      newErrors.description = "Введите описание акции";
    }

    if (!discountValue.trim()) {
      newErrors.discountValue = "Введите размер скидки";
    } else if (parseFloat(discountValue) <= 0) {
      newErrors.discountValue = "Размер скидки должен быть больше 0";
    } else if (discountType === "percentage" && parseFloat(discountValue) > 100) {
      newErrors.discountValue = "Процент скидки не может быть больше 100%";
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

    if (!estimatedRevenue.trim()) {
      newErrors.estimatedRevenue = "Введите ожидаемую выручку";
    } else if (parseFloat(estimatedRevenue) <= 0) {
      newErrors.estimatedRevenue = "Ожидаемая выручка должна быть больше 0";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const promotionDataToSave = {
        name: name.trim(),
        description: description.trim(),
        discountType,
        discountValue: parseFloat(discountValue),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        priority,
        estimatedRevenue: parseFloat(estimatedRevenue),
        status: isEditMode ? promotionData?.status : "draft"
      };

      await onSave(promotionData?.id || 0, promotionDataToSave);
      onClose();
    } catch (error) {
      console.error("Ошибка при сохранении акции:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDiscountDescription = () => {
    if (!discountValue) return "";
    
    switch (discountType) {
      case "percentage":
        return `Скидка ${discountValue}% от стоимости товара`;
      case "fixed":
        return `Фиксированная скидка ${formatCurrency(parseFloat(discountValue))}`;
      case "bogo":
        return "Акция 2 товара по цене 1";
      default:
        return "";
    }
  };

  if (!promotionData && !isOpen) return null;

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
            {isEditMode ? "Редактирование акции" : "Создание новой акции"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isEditMode ? "Изменение параметров существующей акции" : "Настройка новой маркетинговой кампании"}
          </p>
        </div>

        <div className="space-y-6">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Название акции *
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) {
                      setErrors(prev => ({ ...prev, name: "" }));
                    }
                  }}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                    errors.name 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Введите название акции"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Описание акции *
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
                  placeholder="Описание акции для клиентов"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
                )}
              </div>
            </div>

            {/* Discount Settings */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Настройки скидки
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="discountType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Тип скидки *
                  </label>
                  <select
                    id="discountType"
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="percentage">Процентная скидка</option>
                    <option value="fixed">Фиксированная скидка</option>
                    <option value="bogo">2 товара по цене 1</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Размер скидки *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="discountValue"
                      value={discountValue}
                      onChange={(e) => {
                        setDiscountValue(e.target.value);
                        if (errors.discountValue) {
                          setErrors(prev => ({ ...prev, discountValue: "" }));
                        }
                      }}
                      min="0"
                      step={discountType === "percentage" ? "1" : "1"}
                      max={discountType === "percentage" ? "100" : undefined}
                      required
                      disabled={discountType === "bogo"}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                        errors.discountValue 
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      } ${discountType === "bogo" ? 'opacity-50' : ''}`}
                      placeholder="0"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400">
                        {discountType === "percentage" ? "%" : discountType === "fixed" ? "₽" : ""}
                      </span>
                    </div>
                  </div>
                  {errors.discountValue && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.discountValue}</p>
                  )}
                  {discountValue && (
                    <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
                      {getDiscountDescription()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Dates and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Приоритет
                </label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="low">Низкий</option>
                  <option value="medium">Средний</option>
                  <option value="high">Высокий</option>
                </select>
              </div>
            </div>

            {/* Estimated Revenue */}
            <div>
              <label htmlFor="estimatedRevenue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ожидаемая выручка *
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="estimatedRevenue"
                  value={estimatedRevenue}
                  onChange={(e) => {
                    setEstimatedRevenue(e.target.value);
                    if (errors.estimatedRevenue) {
                      setErrors(prev => ({ ...prev, estimatedRevenue: "" }));
                    }
                  }}
                  min="0"
                  step="1000"
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                    errors.estimatedRevenue 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="0"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400">₽</span>
                </div>
              </div>
              {errors.estimatedRevenue && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.estimatedRevenue}</p>
              )}
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Ожидаемая выручка от акции для планирования бюджета
              </p>
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
                {loading ? "Сохранение..." : isEditMode ? "Сохранить изменения" : "Создать акцию"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
};

export default EditPromotionModal;
