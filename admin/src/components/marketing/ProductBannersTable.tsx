"use client";
import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Pagination from "@/components/ui/pagination/Pagination";

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

interface ProductBannersTableProps {
  onView?: (data: ProductBanner) => void;
  onEdit?: (data: ProductBanner) => void;
  onPreview?: (data: ProductBanner) => void;
  onViewBanner?: (data: ProductBanner) => void;
  onEditBanner?: (data: ProductBanner) => void;
  onToggleStatus?: (data: ProductBanner) => void;
  onPreviewBanner?: (data: ProductBanner) => void;
}

// Mock данные рекламных баннеров
const mockProductBanners: ProductBanner[] = [
  {
    id: 1,
    title: "Зимняя распродажа автозапчастей",
    description: "Скидки до 40% на все зимние товары",
    imageUrl: "/images/banners/winter-sale.jpg",
    linkUrl: "/promotions/winter-sale",
    position: "header",
    displayType: "mixed",
    startDate: "2024-12-01T00:00:00Z",
    endDate: "2024-12-31T23:59:59Z",
    status: "active",
    priority: 1,
    clickCount: 1250,
    impressionCount: 25000,
    ctr: 5.0,
    targetAudience: "Все пользователи",
    createdBy: "Иван Петров",
    createdDate: "2024-11-20T10:00:00Z"
  },
  {
    id: 2,
    title: "Новинки автомасел",
    description: "Премиальные масла от ведущих производителей",
    imageUrl: "/images/banners/new-oils.jpg",
    linkUrl: "/products/oils",
    position: "sidebar",
    displayType: "image",
    startDate: "2024-12-10T00:00:00Z",
    endDate: "2025-01-10T23:59:59Z",
    status: "active",
    priority: 2,
    clickCount: 890,
    impressionCount: 18500,
    ctr: 4.8,
    targetAudience: "Владельцы авто",
    createdBy: "Мария Сидорова",
    createdDate: "2024-12-05T14:30:00Z"
  },
  {
    id: 3,
    title: "Диагностика бесплатно",
    description: "При покупке запчастей на сумму от 5000₽",
    imageUrl: "/images/banners/free-diagnostic.jpg",
    linkUrl: "/services/diagnostic",
    position: "popup",
    displayType: "mixed",
    startDate: "2025-01-01T00:00:00Z",
    endDate: "2025-01-31T23:59:59Z",
    status: "scheduled",
    priority: 1,
    clickCount: 0,
    impressionCount: 0,
    ctr: 0,
    targetAudience: "Новые клиенты",
    createdBy: "Алексей Козлов",
    createdDate: "2024-12-20T09:15:00Z"
  },
  {
    id: 4,
    title: "Программа лояльности",
    description: "Накапливайте бонусы за каждую покупку",
    imageUrl: "/images/banners/loyalty-program.jpg",
    linkUrl: "/loyalty",
    position: "footer",
    displayType: "text",
    startDate: "2024-11-01T00:00:00Z",
    endDate: "2025-12-31T23:59:59Z",
    status: "paused",
    priority: 3,
    clickCount: 456,
    impressionCount: 12000,
    ctr: 3.8,
    targetAudience: "Постоянные клиенты",
    createdBy: "Елена Васильева",
    createdDate: "2024-10-25T16:45:00Z"
  },
  {
    id: 5,
    title: "Быстрая доставка",
    description: "Доставка автозапчастей за 2 часа по городу",
    imageUrl: "/images/banners/fast-delivery.jpg",
    linkUrl: "/delivery",
    position: "product-page",
    displayType: "mixed",
    startDate: "2024-12-01T00:00:00Z",
    endDate: "2025-03-01T23:59:59Z",
    status: "draft",
    priority: 2,
    clickCount: 0,
    impressionCount: 0,
    ctr: 0,
    targetAudience: "Жители города",
    createdBy: "Дмитрий Морозов",
    createdDate: "2024-11-30T12:00:00Z"
  }
];

const ProductBannersTable: React.FC<ProductBannersTableProps> = ({
  onView,
  onEdit,
  onPreview,
  onViewBanner,
  onEditBanner,
  onToggleStatus,
  onPreviewBanner,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [positionFilter, setPositionFilter] = useState<string>("all");

  const itemsPerPage = 10;

  // Фильтрация данных
  const filteredData = mockProductBanners.filter((banner) => {
    const matchesSearch = 
      banner.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      banner.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      banner.targetAudience.toLowerCase().includes(searchTerm.toLowerCase()) ||
      banner.createdBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || banner.status === statusFilter;
    const matchesPosition = positionFilter === "all" || banner.position === positionFilter;
    
    return matchesSearch && matchesStatus && matchesPosition;
  });

  // Пагинация
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="light" color="success">Активен</Badge>;
      case "scheduled":
        return <Badge variant="light" color="info">Запланирован</Badge>;
      case "paused":
        return <Badge variant="light" color="warning">Приостановлен</Badge>;
      case "draft":
        return <Badge variant="light" color="light">Черновик</Badge>;
      default:
        return <Badge variant="light" color="light">{status}</Badge>;
    }
  };

  const getPositionBadge = (position: string) => {
    const positions = {
      "header": "Шапка сайта",
      "sidebar": "Боковая панель", 
      "footer": "Подвал",
      "popup": "Всплывающее окно",
      "product-page": "Страница товара"
    };
    
    return <Badge variant="light" color="primary">{positions[position as keyof typeof positions] || position}</Badge>;
  };

  const getDisplayTypeBadge = (type: string) => {
    const types = {
      "image": "Изображение",
      "text": "Текст",
      "mixed": "Смешанный"
    };
    
    return <Badge variant="light" color="info">{types[type as keyof typeof types] || type}</Badge>;
  };

  const getPriorityBadge = (priority: number) => {
    if (priority === 1) return <Badge variant="solid" color="error">Высокий</Badge>;
    if (priority === 2) return <Badge variant="solid" color="warning">Средний</Badge>;
    return <Badge variant="solid" color="light">Низкий</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Фильтры и поиск */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Поиск по названию, описанию, аудитории или автору..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="scheduled">Запланированные</option>
            <option value="paused">Приостановленные</option>
            <option value="draft">Черновики</option>
          </select>
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">Все позиции</option>
            <option value="header">Шапка сайта</option>
            <option value="sidebar">Боковая панель</option>
            <option value="footer">Подвал</option>
            <option value="popup">Всплывающее окно</option>
            <option value="product-page">Страница товара</option>
          </select>
        </div>
      </div>

      {/* Таблица */}
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">Баннер</th>
              <th className="px-4 py-3 text-center font-medium text-gray-900 dark:text-white">Позиция</th>
              <th className="px-4 py-3 text-center font-medium text-gray-900 dark:text-white">Тип</th>
              <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">Период</th>
              <th className="px-4 py-3 text-center font-medium text-gray-900 dark:text-white">Статус</th>
              <th className="px-4 py-3 text-center font-medium text-gray-900 dark:text-white">Приоритет</th>
              <th className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">Статистика</th>
              <th className="px-4 py-3 text-center font-medium text-gray-900 dark:text-white">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.map((banner) => (
              <tr key={banner.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {banner.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {banner.description}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {banner.targetAudience}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  {getPositionBadge(banner.position)}
                </td>
                <td className="px-4 py-3 text-center">
                  {getDisplayTypeBadge(banner.displayType)}
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatDate(banner.startDate)} - {formatDate(banner.endDate)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Создан {formatDate(banner.createdDate)}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  {getStatusBadge(banner.status)}
                </td>
                <td className="px-4 py-3 text-center">
                  {getPriorityBadge(banner.priority)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatNumber(banner.clickCount)} кликов
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatNumber(banner.impressionCount)} показов
                    </div>
                    {banner.ctr > 0 && (
                      <div className="text-xs text-green-600 dark:text-green-400">
                        CTR: {banner.ctr}%
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => (onPreview || onPreviewBanner)?.(banner)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => (onView || onViewBanner)?.(banner)}
                    >
                      Подробнее
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => (onEdit || onEditBanner)?.(banner)}
                    >
                      Редактировать
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {paginatedData.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Нет данных для отображения
          </div>
        )}
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredData.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      )}
    </div>
  );
};

export default ProductBannersTable;
