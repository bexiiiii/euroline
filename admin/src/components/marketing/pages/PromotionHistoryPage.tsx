"use client";
import React, { useState } from "react";
import Button from "../../ui/button/Button";
import Badge from "../../ui/badge/Badge";
import { Modal } from "../../ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";

const PromotionHistoryPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Мок данные для истории акций
  const promotionHistory = [
    {
      id: 1,
      name: "Зимняя распродажа 2024",
      type: "discount",
      startDate: "2024-12-01",
      endDate: "2024-12-31",
      status: "completed",
      totalSales: 1250000,
      participantCount: 450,
      averageDiscount: 25,
      productsCount: 156,
      description: "Скидки до 50% на зимние товары и аксессуары",
      targetAudience: "Все покупатели",
      budget: 300000,
      actualSpent: 275000,
      roi: 354.5
    },
    {
      id: 2,
      name: "Кэшбэк за отзывы",
      type: "cashback",
      startDate: "2024-11-15",
      endDate: "2024-12-15",
      status: "completed",
      totalSales: 850000,
      participantCount: 230,
      averageDiscount: 10,
      productsCount: 89,
      description: "10% кэшбэк за оставленный отзыв на товар",
      targetAudience: "Покупатели с заказами",
      budget: 85000,
      actualSpent: 78500,
      roi: 982.8
    },
    {
      id: 3,
      name: "Новогодние бонусы",
      type: "bonus",
      startDate: "2024-12-25",
      endDate: "2025-01-10",
      status: "active",
      totalSales: 650000,
      participantCount: 180,
      averageDiscount: 15,
      productsCount: 67,
      description: "Бонусные баллы за покупки в новогодние праздники",
      targetAudience: "VIP клиенты",
      budget: 120000,
      actualSpent: 89000,
      roi: 630.3
    },
    {
      id: 4,
      name: "Осенние скидки на масла",
      type: "discount",
      startDate: "2024-09-01",
      endDate: "2024-11-30",
      status: "completed",
      totalSales: 2100000,
      participantCount: 670,
      averageDiscount: 20,
      productsCount: 234,
      description: "Специальные цены на моторные масла и жидкости",
      targetAudience: "Автосервисы и частные клиенты",
      budget: 420000,
      actualSpent: 398000,
      roi: 427.6
    },
    {
      id: 5,
      name: "Летние аксессуары",
      type: "discount",
      startDate: "2024-06-01",
      endDate: "2024-08-31",
      status: "completed",
      totalSales: 780000,
      participantCount: 290,
      averageDiscount: 30,
      productsCount: 145,
      description: "Скидки на автомобильные аксессуары для лета",
      targetAudience: "Владельцы легковых автомобилей",
      budget: 180000,
      actualSpent: 165000,
      roi: 372.7
    },
    {
      id: 6,
      name: "Весенняя подготовка авто",
      type: "bundle",
      startDate: "2024-03-01",
      endDate: "2024-05-31",
      status: "cancelled",
      totalSales: 0,
      participantCount: 0,
      averageDiscount: 0,
      productsCount: 0,
      description: "Комплексные предложения для весеннего ТО",
      targetAudience: "Автосервисы",
      budget: 250000,
      actualSpent: 15000,
      roi: 0
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge color="success">Активна</Badge>;
      case "completed":
        return <Badge color="info">Завершена</Badge>;
      case "cancelled":
        return <Badge color="error">Отменена</Badge>;
      case "scheduled":
        return <Badge color="warning">Запланирована</Badge>;
      case "paused":
        return <Badge color="warning">Приостановлена</Badge>;
      default:
        return <Badge color="light">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "discount":
        return <Badge color="primary">Скидка</Badge>;
      case "cashback":
        return <Badge color="success">Кэшбэк</Badge>;
      case "bonus":
        return <Badge color="warning">Бонусы</Badge>;
      case "bundle":
        return <Badge color="info">Комплект</Badge>;
      default:
        return <Badge color="light">{type}</Badge>;
    }
  };

  const openDetailsModal = (promotion: any) => {
    setSelectedPromotion(promotion);
    setIsModalOpen(true);
  };

  const filteredPromotions = statusFilter === "all" 
    ? promotionHistory 
    : promotionHistory.filter(p => p.status === statusFilter);

  const totalSales = promotionHistory.reduce((sum, p) => sum + p.totalSales, 0);
  const totalParticipants = promotionHistory.reduce((sum, p) => sum + p.participantCount, 0);
  const averageROI = promotionHistory.filter(p => p.roi > 0).reduce((sum, p) => sum + p.roi, 0) / promotionHistory.filter(p => p.roi > 0).length;

  return (
    <div className="space-y-6">
      {/* Общая статистика по акциям */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Всего акций</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {promotionHistory.length}
                </p>
                <div className="ml-2 flex items-center text-sm font-medium text-green-600">
                  <span>за год</span>
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">проведено промо-акций</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Общие продажи</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(totalSales)}
                </p>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">суммарный оборот</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Участники</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {totalParticipants.toLocaleString('ru-RU')}
                </p>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">уникальных покупателей</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Средний ROI</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {averageROI.toFixed(1)}%
                </p>
                <div className="ml-2 flex items-center text-sm font-medium text-green-600">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                  <span>отличный</span>
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">возврат инвестиций</p>
            </div>
          </div>
        </div>
      </div>

      {/* История акций */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                История проведенных акций
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Полная история всех маркетинговых акций и их результаты
              </p>
            </div>
            <Button>
              Создать новую акцию
            </Button>
          </div>

          {/* Фильтры */}
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Статус акции
              </label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">Все статусы</option>
                <option value="active">Активные</option>
                <option value="completed">Завершенные</option>
                <option value="cancelled">Отмененные</option>
                <option value="scheduled">Запланированные</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>Название акции</TableCell>
                  <TableCell>Тип</TableCell>
                  <TableCell>Период</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell>Результаты</TableCell>
                  <TableCell>ROI</TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPromotions.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.description}</div>
                        <div className="text-xs text-gray-400 mt-1">Целевая аудитория: {item.targetAudience}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(item.type)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatDate(item.startDate)}</div>
                        <div className="text-gray-500">до {formatDate(item.endDate)}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{formatCurrency(item.totalSales)}</div>
                        <div className="text-gray-500">{item.participantCount} участников</div>
                        <div className="text-gray-500">{item.productsCount} товаров</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {item.roi > 0 ? (
                          <div className="font-medium text-green-600">+{item.roi.toFixed(1)}%</div>
                        ) : (
                          <div className="font-medium text-gray-400">—</div>
                        )}
                        <div className="text-xs text-gray-500">
                          {item.actualSpent > 0 && `Потрачено: ${formatCurrency(item.actualSpent)}`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openDetailsModal(item)}
                      >
                        Подробнее
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Модальное окно с деталями акции */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="xl">
        {selectedPromotion && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
              Детали акции: {selectedPromotion.name}
            </h3>
            
            <div className="space-y-6">
              {/* Основная информация */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Основная информация</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Тип акции:</span>
                      <span>{getTypeBadge(selectedPromotion.type)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Статус:</span>
                      <span>{getStatusBadge(selectedPromotion.status)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Период:</span>
                      <span className="text-sm">{formatDate(selectedPromotion.startDate)} - {formatDate(selectedPromotion.endDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Средняя скидка:</span>
                      <span className="text-sm font-medium">{selectedPromotion.averageDiscount}%</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Финансовые показатели</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Бюджет:</span>
                      <span className="text-sm font-medium">{formatCurrency(selectedPromotion.budget)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Потрачено:</span>
                      <span className="text-sm">{formatCurrency(selectedPromotion.actualSpent)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Оборот:</span>
                      <span className="text-sm font-medium">{formatCurrency(selectedPromotion.totalSales)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">ROI:</span>
                      <span className={`text-sm font-medium ${selectedPromotion.roi > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                        {selectedPromotion.roi > 0 ? `+${selectedPromotion.roi.toFixed(1)}%` : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Результаты */}
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Результаты акции</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{selectedPromotion.participantCount}</div>
                    <div className="text-sm text-gray-500">участников</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{selectedPromotion.productsCount}</div>
                    <div className="text-sm text-gray-500">товаров в акции</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedPromotion.participantCount > 0 ? (selectedPromotion.totalSales / selectedPromotion.participantCount).toFixed(0) : 0}₽
                    </div>
                    <div className="text-sm text-gray-500">средний чек</div>
                  </div>
                </div>
              </div>

              {/* Описание */}
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Описание</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedPromotion.description}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  <strong>Целевая аудитория:</strong> {selectedPromotion.targetAudience}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Закрыть
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PromotionHistoryPage;
