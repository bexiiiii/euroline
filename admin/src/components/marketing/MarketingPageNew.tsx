"use client";
import React, { useState } from "react";
import ComponentCard from "../common/ComponentCard";
import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";
import { Modal } from "../ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Select from "../form/Select";

const MarketingPage = () => {
  const [activeTab, setActiveTab] = useState("history");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("promotion");
  const [selectedItem, setSelectedItem] = useState(null);

  // Данные для истории акций
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
      description: "Скидки до 50% на зимние товары", 
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
      description: "10% кэшбэк за оставленный отзыв", 
      budget: 85000, 
      actualSpent: 78500, 
      roi: 982.8 
    }
  ];

  // Данные для акций на товары
  const productPromotions = [
    {
      id: 1,
      productName: "Масло моторное Shell Helix Ultra 5W-30",
      productCode: "SH5W30-4L",
      category: "Масла и жидкости",
      originalPrice: 2500,
      discountPrice: 1999,
      discountPercent: 20,
      startDate: "2024-12-01",
      endDate: "2024-12-31",
      status: "active",
      soldCount: 45,
      stockCount: 120
    }
  ];

  // Данные для баннеров
  const adBanners = [
    {
      id: 1,
      title: "Зимняя распродажа - скидки до 50%",
      position: "header",
      clickCount: 1250,
      impressions: 45000,
      ctr: 2.78,
      status: "active",
      startDate: "2024-12-01",
      endDate: "2024-12-31",
      targetAudience: "Все посетители"
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
      default:
        return <Badge color="light">{type}</Badge>;
    }
  };

  const getPositionBadge = (position: string) => {
    switch (position) {
      case "header":
        return <Badge color="primary">Шапка</Badge>;
      case "sidebar":
        return <Badge color="info">Боковая панель</Badge>;
      case "footer":
        return <Badge color="light">Подвал</Badge>;
      case "popup":
        return <Badge color="warning">Всплывающее окно</Badge>;
      default:
        return <Badge color="light">{position}</Badge>;
    }
  };

  const openModal = (type: "promotion" | "banner" | "balance", item?: any) => {
    setModalType(type);
    setSelectedItem(item || null);
    setIsModalOpen(true);
  };

  const paymentMethodOptions = [
    { value: "manual", label: "Ручной платеж" },
    { value: "bank", label: "Банковский перевод" },
    { value: "cash", label: "Наличные" }
  ];

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Активные акции</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">8</p>
            <div className="ml-2 flex items-center text-sm font-medium text-green-600">
              <span>+2</span>
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">промо-акций запущено</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Товары в акциях</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">156</p>
            <div className="ml-2 flex items-center text-sm font-medium text-green-600">
              <span>+24</span>
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">позиций участвует</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Рекламные баннеры</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">12</p>
            <div className="ml-2 flex items-center text-sm font-medium text-blue-600">
              <span>+1</span>
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">баннеров активно</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Конверсия</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">24.3%</p>
            <div className="ml-2 flex items-center text-sm font-medium text-green-600">
              <span>+1.2%</span>
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">среднее по акциям</p>
        </div>
      </div>

      {/* Управление балансом */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Баланс промо-акций</h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
              {formatCurrency(450000)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Доступно для промо-акций, кэшбэков и рекламы
            </p>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={() => openModal("balance")}
            >
              Пополнить баланс
            </Button>
            <Button 
              onClick={() => openModal("promotion")}
            >
              Создать акцию
            </Button>
          </div>
        </div>
      </div>

      {/* Основной контент с табами */}
      <ComponentCard
        title="Маркетинг и акции"
        description="Управление промо-акциями, скидками на товары и рекламными баннерами"
        action={
          <div className="flex space-x-2">
            <Button size="sm" variant="outline">Экспорт отчета</Button>
            <Button size="sm">Аналитика</Button>
          </div>
        }
      >
        {/* Табы */}
        <div className="border-b border-gray-200 dark:border-gray-700 -mx-6 px-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("history")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "history"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              История акций
            </button>
            <button
              onClick={() => setActiveTab("promotions")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "promotions"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Акции на товары
            </button>
            <button
              onClick={() => setActiveTab("banners")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "banners"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Рекламные баннеры
            </button>
          </nav>
        </div>

        {/* Контент табов */}
        <div className="mt-6">
          {activeTab === "history" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  История проведенных акций
                </h3>
                <Button onClick={() => openModal("promotion")}>
                  Создать новую акцию
                </Button>
              </div>
              
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className="max-w-full overflow-x-auto">
                  <div className="min-w-[1200px]">
                    <Table>
                      <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                        <TableRow>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Название акции</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Тип</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Период</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Статус</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Результаты</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">ROI</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Действия</TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                        {promotionHistory.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="px-5 py-4 sm:px-6 text-start">
                              <div>
                                <div className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{item.name}</div>
                                <div className="text-gray-500 text-theme-xs dark:text-gray-400">{item.description}</div>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-start text-theme-sm">{getTypeBadge(item.type)}</TableCell>
                            <TableCell className="px-4 py-3 text-gray-700 text-start text-theme-sm dark:text-gray-300">
                              <div>
                                {formatDate(item.startDate)} - {formatDate(item.endDate)}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-start text-theme-sm">{getStatusBadge(item.status)}</TableCell>
                            <TableCell className="px-4 py-3 text-start text-theme-sm">
                              <div>
                                <div className="font-medium text-gray-800 dark:text-white/90">{formatCurrency(item.totalSales)}</div>
                                <div className="text-gray-500 text-theme-xs dark:text-gray-400">{item.participantCount} участников</div>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-start text-theme-sm">
                              <div className="font-medium text-green-600 dark:text-green-400">
                                +{item.roi.toFixed(1)}%
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-start">
                              <Button size="sm" variant="outline" onClick={() => openModal("promotion", item)}>
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
            </div>
          )}

          {activeTab === "promotions" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Активные акции на товары
                </h3>
                <Button onClick={() => openModal("promotion")}>
                  Добавить товар в акцию
                </Button>
              </div>
              
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className="max-w-full overflow-x-auto">
                  <div className="min-w-[1200px]">
                    <Table>
                      <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                        <TableRow>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Товар</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Категория</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Цена / Скидка</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Период акции</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Статус</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Продано / Остаток</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Действия</TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                        {productPromotions.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="px-5 py-4 sm:px-6 text-start">
                              <div>
                                <div className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{item.productName}</div>
                                <div className="text-gray-500 text-theme-xs dark:text-gray-400">Код: {item.productCode}</div>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-start text-theme-sm">
                              <Badge color="light">{item.category}</Badge>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-start text-theme-sm">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="line-through text-gray-400 text-theme-xs">{formatCurrency(item.originalPrice)}</span>
                                  <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(item.discountPrice)}</span>
                                </div>
                                <div className="text-green-600 text-theme-xs dark:text-green-400">-{item.discountPercent}%</div>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-gray-700 text-start text-theme-sm dark:text-gray-300">
                              <div>
                                {formatDate(item.startDate)} - {formatDate(item.endDate)}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-start text-theme-sm">{getStatusBadge(item.status)}</TableCell>
                            <TableCell className="px-4 py-3 text-start text-theme-sm">
                              <div>
                                <div className="font-medium text-green-600 dark:text-green-400">Продано: {item.soldCount} шт.</div>
                                <div className="text-gray-500 text-theme-xs dark:text-gray-400">Остаток: {item.stockCount} шт.</div>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-start">
                              <Button size="sm" variant="outline" onClick={() => openModal("promotion", item)}>
                                Редактировать
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "banners" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Управление рекламными баннерами
                </h3>
                <Button onClick={() => openModal("banner")}>
                  Создать баннер
                </Button>
              </div>
              
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className="max-w-full overflow-x-auto">
                  <div className="min-w-[1200px]">
                    <Table>
                      <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                        <TableRow>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Заголовок</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Позиция</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Период показа</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Статистика</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Статус</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Действия</TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                        {adBanners.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="px-5 py-4 sm:px-6 text-start">
                              <div>
                                <div className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{item.title}</div>
                                <div className="text-gray-500 text-theme-xs dark:text-gray-400">{item.targetAudience}</div>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-start text-theme-sm">{getPositionBadge(item.position)}</TableCell>
                            <TableCell className="px-4 py-3 text-gray-700 text-start text-theme-sm dark:text-gray-300">
                              <div>
                                {formatDate(item.startDate)} - {formatDate(item.endDate)}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-start text-theme-sm">
                              <div>
                                <div className="text-gray-800 dark:text-white/90">Показы: {item.impressions.toLocaleString('ru-RU')}</div>
                                <div className="text-gray-800 dark:text-white/90">Клики: {item.clickCount.toLocaleString('ru-RU')}</div>
                                <div className="text-gray-500 text-theme-xs dark:text-gray-400">CTR: {item.ctr}%</div>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-start text-theme-sm">{getStatusBadge(item.status)}</TableCell>
                            <TableCell className="px-4 py-3 text-start">
                              <Button size="sm" variant="outline" onClick={() => openModal("banner", item)}>
                                Редактировать
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ComponentCard>

      {/* Модальное окно пополнения баланса */}
      <Modal isOpen={isModalOpen && modalType === "balance"} onClose={() => setIsModalOpen(false)} size="md">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
            Пополнение баланса промо-акций
          </h3>
          <div className="space-y-4">
            <div>
              <Label>Сумма пополнения (₽)</Label>
              <Input type="number" placeholder="Введите сумму в рублях" />
            </div>
            <div>
              <Label>Способ пополнения</Label>
              <Select 
                options={paymentMethodOptions}
                onChange={(value) => console.log("Selected payment method:", value)}
                placeholder="Выберите способ пополнения"
              />
            </div>
            <div>
              <Label>Комментарий</Label>
              <textarea
                rows={3}
                placeholder="Укажите назначение пополнения"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Отменить
              </Button>
              <Button onClick={() => setIsModalOpen(false)}>
                Пополнить баланс
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MarketingPage;
