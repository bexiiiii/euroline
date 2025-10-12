"use client";
import React, { useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "../ui/button/Button";
import ExportWithDateRange, { ExportDateRange } from "@/components/common/ExportWithDateRange";
import Badge from "../ui/badge/Badge";
import { Modal } from "../ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import { exportAdminData } from "@/lib/api/importExport";
import { useToast } from "@/context/ToastContext";

const MarketingPage = () => {
  const [activeTab, setActiveTab] = useState("history");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("promotion");
  type ModalSelection = Record<string, string | number | null | undefined>;
  const [selectedItem, setSelectedItem] = useState<ModalSelection | null>(null);
  const { success: showSuccess, error: showError } = useToast();

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
      description: "Бонусные баллы за покупки", 
      budget: 120000, 
      actualSpent: 89000, 
      roi: 630.3 
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
    },
    {
      id: 2,
      productName: "Тормозные колодки Brembo P85020",
      productCode: "BR-P85020",
      category: "Тормозная система",
      originalPrice: 4500,
      discountPrice: 3600,
      discountPercent: 20,
      startDate: "2024-12-15",
      endDate: "2025-01-15",
      status: "scheduled",
      soldCount: 12,
      stockCount: 35
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
    },
    {
      id: 2,
      title: "Новые поступления автозапчастей",
      position: "sidebar",
      clickCount: 890,
      impressions: 32000,
      ctr: 2.78,
      status: "active",
      startDate: "2024-12-10",
      endDate: "2025-01-10",
      targetAudience: "Постоянные клиенты"
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
      case "expired":
        return <Badge color="light">Истекла</Badge>;
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

  const openModal = (
    type: "promotion" | "banner" | "balance",
    item?: ModalSelection
  ) => {
    setModalType(type);
    setSelectedItem(item ?? null);
    setIsModalOpen(true);
  };

  const paymentMethodOptions = [
    { value: "manual", label: "Ручной платеж" },
    { value: "bank", label: "Банковский перевод" },
    { value: "cash", label: "Наличные" }
  ];

  const promotionTypeOptions = [
    { value: "discount", label: "Скидка" },
    { value: "cashback", label: "Кэшбэк" },
    { value: "bonus", label: "Бонусы" }
  ];

  const bannerPositionOptions = [
    { value: "header", label: "Шапка сайта" },
    { value: "sidebar", label: "Боковая панель" },
    { value: "footer", label: "Подвал сайта" },
    { value: "popup", label: "Всплывающее окно" }
  ];

  const buildFileName = (base: string, from?: string, to?: string) => {
    const parts = [base];
    if (from) parts.push(from);
    if (to && to !== from) parts.push(to);
    return `${parts.join("-")}.csv`;
  };

  const handleExportReport = async ({ from, to }: ExportDateRange) => {
    try {
      await exportAdminData({
        type: "products",
        from: from || undefined,
        to: to || undefined,
        fileName: buildFileName("marketing-report", from, to),
      });
      showSuccess("Маркетинговый отчёт экспортирован");
    } catch (error) {
      console.error("Не удалось экспортировать маркетинговый отчёт", error);
      showError("Не удалось экспортировать маркетинговый отчёт");
    }
  };

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
            <ExportWithDateRange
              triggerLabel="Экспорт отчета"
              variant="outline"
              size="sm"
              onConfirm={handleExportReport}
              title="Экспорт маркетингового отчета"
              description="Выберите диапазон дат для выгрузки отчета по маркетинговым активностям."
            />
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
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell isHeader>Название акции</TableCell>
                      <TableCell isHeader>Тип</TableCell>
                      <TableCell isHeader>Период</TableCell>
                      <TableCell isHeader>Статус</TableCell>
                      <TableCell isHeader>Результаты</TableCell>
                      <TableCell isHeader>ROI</TableCell>
                      <TableCell isHeader>Действия</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promotionHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{item.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(item.type)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(item.startDate)} - {formatDate(item.endDate)}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{formatCurrency(item.totalSales)}</div>
                            <div className="text-gray-500 dark:text-gray-400">{item.participantCount} участников</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium text-green-600">
                            +{item.roi.toFixed(1)}%
                          </div>
                        </TableCell>
                        <TableCell>
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
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell isHeader>Товар</TableCell>
                      <TableCell isHeader>Категория</TableCell>
                      <TableCell isHeader>Цена / Скидка</TableCell>
                      <TableCell isHeader>Период акции</TableCell>
                      <TableCell isHeader>Статус</TableCell>
                      <TableCell isHeader>Продано / Остаток</TableCell>
                      <TableCell isHeader>Действия</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productPromotions.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{item.productName}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Код: {item.productCode}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge color="light">{item.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="line-through text-gray-400 text-sm">{formatCurrency(item.originalPrice)}</span>
                              <span className="font-bold text-red-600">{formatCurrency(item.discountPrice)}</span>
                            </div>
                            <div className="text-sm text-green-600">-{item.discountPercent}%</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(item.startDate)} - {formatDate(item.endDate)}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium text-green-600">Продано: {item.soldCount} шт.</div>
                            <div className="text-gray-500">Остаток: {item.stockCount} шт.</div>
                          </div>
                        </TableCell>
                        <TableCell>
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
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell isHeader>Заголовок</TableCell>
                      <TableCell isHeader>Позиция</TableCell>
                      <TableCell isHeader>Период показа</TableCell>
                      <TableCell isHeader>Статистика</TableCell>
                      <TableCell isHeader>Статус</TableCell>
                      <TableCell isHeader>Действия</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adBanners.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{item.title}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{item.targetAudience}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getPositionBadge(item.position)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(item.startDate)} - {formatDate(item.endDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Показы: {item.impressions.toLocaleString('ru-RU')}</div>
                            <div>Клики: {item.clickCount.toLocaleString('ru-RU')}</div>
                            <div>CTR: {item.ctr}%</div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>
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
          )}
        </div>
      </ComponentCard>

      {/* Модальные окна */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="xl">
        <div className="p-6">
          {modalType === "balance" && (
            <div>
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
          )}

          {modalType === "promotion" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                {selectedItem ? "Детали акции" : "Создание новой акции"}
              </h3>
              <div className="space-y-4">
                <div>
                  <Label>Название акции</Label>
                  <Input 
                    type="text" 
                    placeholder="Введите название акции"
                    defaultValue={selectedItem?.name || ""} 
                  />
                </div>
                <div>
                  <Label>Тип акции</Label>
                  <Select 
                    options={promotionTypeOptions}
                    onChange={(value) => console.log("Selected promotion type:", value)}
                    placeholder="Выберите тип акции"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Дата начала</Label>
                    <Input 
                      type="date"
                      defaultValue={selectedItem?.startDate || ""} 
                    />
                  </div>
                  <div>
                    <Label>Дата окончания</Label>
                    <Input 
                      type="date"
                      defaultValue={selectedItem?.endDate || ""} 
                    />
                  </div>
                </div>
                <div>
                  <Label>Описание акции</Label>
                  <textarea
                    rows={3}
                    placeholder="Описание акции для покупателей"
                    defaultValue={selectedItem?.description || ""}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                    Отменить
                  </Button>
                  <Button onClick={() => setIsModalOpen(false)}>
                    {selectedItem ? "Сохранить изменения" : "Создать акцию"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {modalType === "banner" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                {selectedItem ? "Редактирование баннера" : "Создание рекламного баннера"}
              </h3>
              <div className="space-y-4">
                <div>
                  <Label>Заголовок баннера</Label>
                  <Input 
                    type="text" 
                    placeholder="Введите заголовок баннера"
                    defaultValue={selectedItem?.title || ""} 
                  />
                </div>
                <div>
                  <Label>Позиция размещения</Label>
                  <Select 
                    options={bannerPositionOptions}
                    onChange={(value) => console.log("Selected banner position:", value)}
                    placeholder="Выберите позицию"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Дата начала показа</Label>
                    <Input 
                      type="date"
                      defaultValue={selectedItem?.startDate || ""} 
                    />
                  </div>
                  <div>
                    <Label>Дата окончания показа</Label>
                    <Input 
                      type="date"
                      defaultValue={selectedItem?.endDate || ""} 
                    />
                  </div>
                </div>
                <div>
                  <Label>URL для перехода</Label>
                  <Input 
                    type="url" 
                    placeholder="https://example.com/page"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                    Отменить
                  </Button>
                  <Button onClick={() => setIsModalOpen(false)}>
                    {selectedItem ? "Сохранить изменения" : "Создать баннер"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default MarketingPage;
