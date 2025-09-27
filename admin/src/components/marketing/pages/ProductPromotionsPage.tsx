"use client";
import React, { useState, useEffect } from "react";
import Button from "../../ui/button/Button";
import Badge from "../../ui/badge/Badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Modal } from "@/components/ui/modal";
import { promotionsApi, Promotion, CreatePromotionRequest, UpdatePromotionRequest } from "@/lib/api/promotions";
import { productApi, Product } from "@/lib/api/products";
import { categoriesApi, Category } from "@/lib/api/categories";

interface PromotionStats {
  activePromotions: number;
  totalPromotions: number;
  averageDiscount: number;
  totalUsageCount: number;
}

const ProductPromotionsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"create" | "edit">("create");
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<PromotionStats>({
    activePromotions: 0,
    totalPromotions: 0,
    averageDiscount: 0,
    totalUsageCount: 0,
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startsAt: '',
    endsAt: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [promotionsResponse, productsResponse, categoriesResponse] = await Promise.all([
        promotionsApi.getPromotions(0, 100),
        productApi.getProducts(),
        categoriesApi.getCategories(0, 100),
      ]);

      setPromotions(promotionsResponse.content);
      setProducts(productsResponse);
      // categoriesApi.getCategories возвращает страницу
      // @ts-ignore
      setCategories((categoriesResponse as any).content || categoriesResponse);

      const activePromotions = promotionsResponse.content.filter((p: Promotion) => p.status === 'ACTIVE').length;
      setStats({
        activePromotions,
        totalPromotions: promotionsResponse.content.length,
        averageDiscount: 0,
        totalUsageCount: 0,
      });
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge color="success">Активна</Badge>;
      case "INACTIVE":
        return <Badge color="light">Неактивна</Badge>;
      default:
        return <Badge color="light">{status}</Badge>;
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startsAt: '',
      endsAt: '',
      status: 'ACTIVE',
    });
  };

  const openCreateModal = () => {
    setModalType("create");
    setSelectedPromotion(null);
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (promotion: Promotion) => {
    setModalType("edit");
    setSelectedPromotion(promotion);
    setFormData({
      title: promotion.title,
      description: promotion.description,
      discount: promotion.discount,
      type: promotion.type,
      startDate: promotion.startDate.split('T')[0],
      endDate: promotion.endDate.split('T')[0],
      minOrderAmount: promotion.minOrderAmount?.toString() || '',
      maxDiscountAmount: promotion.maxDiscountAmount?.toString() || '',
      usageLimit: promotion.usageLimit?.toString() || '',
      applicableCategories: promotion.applicableCategories || [],
      applicableProducts: promotion.applicableProducts || [],
    });
    setIsModalOpen(true);
  };

  const handleSavePromotion = async () => {
    try {
      const requestData: CreatePromotionRequest = {
        title: formData.title,
        description: formData.description,
        discount: formData.discount,
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : undefined,
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : undefined,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
        applicableCategories: formData.applicableCategories.length > 0 ? formData.applicableCategories : undefined,
        applicableProducts: formData.applicableProducts.length > 0 ? formData.applicableProducts : undefined,
      };

      if (modalType === "create") {
        await promotionsApi.createPromotion(requestData);
      } else if (selectedPromotion) {
        const updateData: UpdatePromotionRequest = {
          ...requestData,
          isActive: selectedPromotion.isActive,
        };
        await promotionsApi.updatePromotion(selectedPromotion.id, updateData);
      }

      await loadData();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Ошибка сохранения промо-акции:', error);
    }
  };

  const handleToggleStatus = async (promotion: Promotion) => {
    try {
      await promotionsApi.togglePromotionStatus(promotion.id);
      await loadData();
    } catch (error) {
      console.error('Ошибка изменения статуса:', error);
    }
  };

  const handleDeletePromotion = async (promotion: Promotion) => {
    if (window.confirm('Вы уверены, что хотите удалить эту промо-акцию?')) {
      try {
        await promotionsApi.deletePromotion(promotion.id);
        await loadData();
      } catch (error) {
        console.error('Ошибка удаления промо-акции:', error);
      }
    }
  };

  const getApplicableProductsText = (productIds?: number[]) => {
    if (!productIds || productIds.length === 0) return "Все товары";
    return `Выбрано товаров: ${productIds.length}`;
  };

  const getApplicableCategoriesText = (categoryIds?: string[]) => {
    if (!categoryIds || categoryIds.length === 0) return "Все категории";
    return `Выбрано категорий: ${categoryIds.length}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Загрузка промо-акций...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Адаптивная статистика по промо-акциям */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-sm sm:text-lg font-medium text-gray-900 dark:text-white">Активные акции</h3>
              <div className="mt-1 sm:mt-2 flex items-baseline">
                <p className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.activePromotions}
                </p>
                <div className="ml-1 sm:ml-2 flex items-center text-xs sm:text-sm font-medium text-green-600">
                  <span>из {stats.totalPromotions}</span>
                </div>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">промо-акций</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-sm sm:text-lg font-medium text-gray-900 dark:text-white">Средняя скидка</h3>
              <div className="mt-1 sm:mt-2 flex items-baseline">
                <p className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.averageDiscount.toFixed(0)}{stats.averageDiscount > 0 ? (promotions[0]?.type === 'PERCENTAGE' ? '%' : '₽') : '%'}
                </p>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">по всем акциям</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-sm sm:text-lg font-medium text-gray-900 dark:text-white">Использований</h3>
              <div className="mt-1 sm:mt-2 flex items-baseline">
                <p className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.totalUsageCount}
                </p>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">всего применений</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-sm sm:text-lg font-medium text-gray-900 dark:text-white">Запланированные</h3>
              <div className="mt-1 sm:mt-2 flex items-baseline">
                <p className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {promotions.filter(p => {
                    const now = new Date();
                    const start = new Date(p.startDate);
                    return p.isActive && now < start;
                  }).length}
                </p>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">акций в будущем</p>
            </div>
          </div>
        </div>
      </div>

      {/* Адаптивное управление промо-акциями */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white">
                Промо-акции
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                Управление скидками и специальными предложениями
              </p>
            </div>
            <Button onClick={openCreateModal} className="w-full sm:w-auto">
              <span className="sm:hidden">+ Акция</span>
              <span className="hidden sm:inline">Создать промо-акцию</span>
            </Button>
          </div>
        </div>

        <div className="p-6">
          {/* Адаптивная таблица */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader className="min-w-[200px]">Акция</TableCell>
                  <TableCell isHeader className="min-w-[120px]">Скидка</TableCell>
                  <TableCell isHeader className="min-w-[140px] hidden sm:table-cell">Период</TableCell>
                  <TableCell isHeader className="min-w-[100px]">Статус</TableCell>
                  <TableCell isHeader className="min-w-[150px] hidden md:table-cell">Применимость</TableCell>
                  <TableCell isHeader className="min-w-[120px] hidden lg:table-cell">Использований</TableCell>
                  <TableCell isHeader className="min-w-[200px]">Действия</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions.map((promotion) => (
                  <TableRow key={promotion.id}>
                    <TableCell className="min-w-[200px]">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm lg:text-base">
                          {promotion.title}
                        </div>
                        <div className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 mt-1" 
                             style={{
                               display: '-webkit-box',
                               WebkitLineClamp: 2,
                               WebkitBoxOrient: 'vertical',
                               overflow: 'hidden'
                             }}>
                          {promotion.description}
                        </div>
                        {/* Мобильная информация о периоде */}
                        <div className="text-xs text-gray-500 mt-2 sm:hidden">
                          <div>{formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[120px]">
                      <div>
                        <div className="font-bold text-red-600 text-sm lg:text-base">
                          {promotion.discount}{promotion.type === 'PERCENTAGE' ? '%' : '₽'}
                        </div>
                        {promotion.minOrderAmount && (
                          <div className="text-xs text-gray-500 hidden lg:block">
                            Мин. заказ: {formatCurrency(promotion.minOrderAmount)}
                          </div>
                        )}
                        {promotion.maxDiscountAmount && (
                          <div className="text-xs text-gray-500 hidden lg:block">
                            Макс. скидка: {formatCurrency(promotion.maxDiscountAmount)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[140px] hidden sm:table-cell">
                      <div className="text-sm">
                        <div>{formatDate(promotion.startDate)}</div>
                        <div className="text-gray-500">до {formatDate(promotion.endDate)}</div>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[100px]">
                      {getStatusBadge(promotion.isActive, promotion.startDate, promotion.endDate)}
                      {/* Мобильная информация о применимости */}
                      <div className="text-xs text-gray-500 mt-2 md:hidden">
                        <div>{getApplicableCategoriesText(promotion.applicableCategories)}</div>
                        <div>{getApplicableProductsText(promotion.applicableProducts)}</div>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[150px] hidden md:table-cell">
                      <div className="text-sm">
                        <div>{getApplicableCategoriesText(promotion.applicableCategories)}</div>
                        <div className="text-gray-500">{getApplicableProductsText(promotion.applicableProducts)}</div>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[120px] hidden lg:table-cell">
                      <div className="text-sm">
                        <div className="font-medium text-green-600">
                          Использовано: {promotion.usageCount}
                          {promotion.usageLimit && ` из ${promotion.usageLimit}`}
                        </div>
                        {promotion.usageLimit && (
                          <div className="text-gray-500">
                            Остается: {promotion.usageLimit - promotion.usageCount}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[200px]">
                      {/* Адаптивные кнопки действий */}
                      <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openEditModal(promotion)}
                          className="text-xs sm:text-sm"
                        >
                          <span className="sm:hidden">✏️</span>
                          <span className="hidden sm:inline">Редактировать</span>
                        </Button>
                        <Button 
                          size="sm" 
                          variant={promotion.isActive ? "outline" : "primary"}
                          onClick={() => handleToggleStatus(promotion)}
                          className="text-xs sm:text-sm"
                        >
                          <span className="sm:hidden">{promotion.isActive ? '⏸️' : '▶️'}</span>
                          <span className="hidden sm:inline">{promotion.isActive ? 'Отключить' : 'Включить'}</span>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeletePromotion(promotion)}
                          className="text-xs sm:text-sm text-red-600 hover:text-red-700"
                        >
                          <span className="sm:hidden">🗑️</span>
                          <span className="hidden sm:inline">Удалить</span>
                        </Button>
                      </div>
                      {/* Мобильная информация об использовании */}
                      <div className="text-xs text-gray-500 mt-2 lg:hidden">
                        <div className="font-medium text-green-600">
                          Использовано: {promotion.usageCount}
                          {promotion.usageLimit && ` из ${promotion.usageLimit}`}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Карточный вид для мобильных устройств (альтернатива) */}
          <div className="block sm:hidden mt-6">
            <div className="text-sm text-gray-500 mb-4">
              Для удобства на мобильных устройствах информация отображается в компактном виде
            </div>
          </div>
        </div>
      </div>

      {/* Адаптивное модальное окно для создания/редактирования промо-акции */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="xl">
        <div className="p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-4 sm:mb-6">
            {modalType === "create" ? "Создать промо-акцию" : "Редактировать промо-акцию"}
          </h3>
          
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Название акции *
                </label>
                <input
                  type="text"
                  placeholder="Введите название акции"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Тип скидки
                </label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as 'PERCENTAGE' | 'FIXED'})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm sm:text-base"
                >
                  <option value="PERCENTAGE">Процентная скидка</option>
                  <option value="FIXED">Фиксированная сумма</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Описание акции
              </label>
              <textarea
                rows={3}
                placeholder="Краткое описание акции для покупателей"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm sm:text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Размер скидки *
                </label>
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  value={formData.discount}
                  onChange={(e) => setFormData({...formData, discount: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Мин. сумма заказа
                </label>
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({...formData, minOrderAmount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Макс. размер скидки
                </label>
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  value={formData.maxDiscountAmount}
                  onChange={(e) => setFormData({...formData, maxDiscountAmount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Дата начала акции *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Дата окончания акции *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Лимит использований
                </label>
                <input
                  type="number"
                  placeholder="Без ограничений"
                  min="1"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Применимые категории
                </label>
                <select 
                  multiple
                  value={formData.applicableCategories}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData({...formData, applicableCategories: values});
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm sm:text-base"
                  size={4}
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Удерживайте Ctrl/Cmd для множественного выбора</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Применимые товары
                </label>
                <select 
                  multiple
                  value={formData.applicableProducts.map(String)}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                    setFormData({...formData, applicableProducts: values});
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm sm:text-base"
                  size={4}
                >
                  {products.slice(0, 50).map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.code})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Показаны первые 50 товаров</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto">
                Отменить
              </Button>
              <Button onClick={handleSavePromotion} className="w-full sm:w-auto">
                {modalType === "create" ? "Создать акцию" : "Сохранить изменения"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProductPromotionsPage;
