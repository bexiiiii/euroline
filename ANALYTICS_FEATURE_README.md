# Документация: Модуль аналитики и статистики

## Обзор изменений

Проект был существенно обновлен с добавлением полноценной системы аналитики и статистики для админ-панели. Все компоненты интегрированы с бэкендом и используют готовые UI-элементы проекта.

## Новые возможности

### 1. Главная страница статистики (Dashboard)

**Файл:** `/admin/src/app/(admin)/page.tsx`

#### Обновленные компоненты:

**EcommerceMetrics** (`/admin/src/components/ecommerce/EcommerceMetrics.tsx`)
- ✅ Подключение к бэкенду через `analyticsApi.getDashboard()`
- ✅ Отображение реальных данных: клиенты, заказы, товары, доход
- ✅ Состояния загрузки (skeleton)
- ✅ Цветовая дифференциация метрик
- ✅ Иконки для каждой метрики

**MonthlySalesChart** (`/admin/src/components/ecommerce/MonthlySalesChart.tsx`)
- ✅ Обновленный график продаж по месяцам
- ✅ Локализация на русский язык
- ✅ Состояния загрузки
- ✅ Dropdown меню с действиями

**StatisticsChart** (`/admin/src/components/ecommerce/StatisticsChart.tsx`)
- ✅ График статистики продаж и выручки
- ✅ Двойная ось для продаж и выручки
- ✅ Локализация на русский язык
- ✅ Состояния загрузки

### 2. Новая страница аналитики `/analytics`

**Файл:** `/admin/src/app/(admin)/analytics/page.tsx`

Профессиональная страница аналитики с множеством компонентов:

#### Компоненты аналитики:

**AnalyticsDashboard** (`/admin/src/components/analytics/AnalyticsDashboard.tsx`)
- Главный контейнер страницы аналитики
- Фильтрация по датам
- Адаптивная сетка компонентов

**AnalyticsMetrics** (`/admin/src/components/analytics/AnalyticsMetrics.tsx`)
- 4 ключевые метрики: клиенты, заказы, выручка, средний чек
- Подключение к API: `getTotalUsers()`, `getTotalOrders()`, `getTotalRevenue()`
- Тренды и процентные изменения
- Цветовое кодирование

**RevenueChart** (`/admin/src/components/analytics/RevenueChart.tsx`)
- График динамики выручки
- Фильтрация по датам
- API: `getRevenueChart(from, to)`
- Градиентная заливка area chart

**OrdersAnalytics** (`/admin/src/components/analytics/OrdersAnalytics.tsx`)
- Столбчатый график заказов по месяцам
- Анализ количества заказов

**FinanceOverview** (`/admin/src/components/analytics/FinanceOverview.tsx`)
- Финансовая сводка
- API: `getFinance()`
- Данные: общий баланс, пополнения, возвраты, ожидающие операции
- Визуализация трендов

**TopProductsTable** (`/admin/src/components/analytics/TopProductsTable.tsx`)
- Таблица топ продаж
- API: `getTopProducts()`
- Ранжирование товаров
- Продажи, выручка, рост

**CategoryDistribution** (`/admin/src/components/analytics/CategoryDistribution.tsx`)
- Круговая диаграмма распределения по категориям
- Donut chart с процентами
- Детализированный список категорий

**CustomerGrowthChart** (`/admin/src/components/analytics/CustomerGrowthChart.tsx`)
- График роста клиентской базы
- Две линии: новые клиенты и всего клиентов
- Двойная ось Y

**SalesHeatmap** (`/admin/src/components/analytics/SalesHeatmap.tsx`)
- Тепловая карта продаж
- Активность по часам и дням недели
- Определение пиковых часов

## Обновления API

### Файл: `/admin/src/lib/api/analytics.ts`

Новые типы:
```typescript
interface DashboardStats {
  orders: number;
  products: number;
  customers: number;
  finance: { ... };
}

interface ChartDataPoint {
  date: string;
  value: number;
}
```

Новые методы API:
- `getDashboard()` - общая статистика
- `getTotalUsers()` - всего пользователей
- `getTotalOrders()` - всего заказов
- `getTotalRevenue()` - общая выручка
- `getTopProducts()` - топ товары
- `getRevenueChart(from, to)` - график выручки
- `getRevenue(from, to)` - выручка за период
- `getSales()` - данные продаж
- `getCustomers()` - данные клиентов
- `getProducts()` - данные товаров
- `getFinance()` - финансовая статистика

## Бэкенд интеграция

### Используемые эндпоинты:

#### Analytics Controller (`/api/analytics`)
- `GET /api/analytics/dashboard` - общая статистика
- `GET /api/analytics/sales` - продажи
- `GET /api/analytics/customers` - клиенты
- `GET /api/analytics/products` - товары
- `GET /api/analytics/finance` - финансы

#### Admin Analytics Controller (`/api/admin/analytics`)
- `GET /api/admin/analytics/total-users` - всего пользователей
- `GET /api/admin/analytics/total-orders` - всего заказов
- `GET /api/admin/analytics/total-revenue` - общая выручка
- `GET /api/admin/analytics/top-products` - топ товары
- `GET /api/admin/analytics/revenue-chart?from={date}&to={date}` - график выручки
- `GET /api/admin/analytics/revenue?from={date}&to={date}` - выручка за период

### Java сервисы (Backend)

**AdminAnalyticsService.java**
- `getTotalUsers()` - подсчет пользователей
- `getTotalOrders()` - подсчет заказов
- `getTotalRevenue()` - расчет выручки
- `getTopProducts()` - топ 5 товаров
- `getRevenueBetweenDates()` - выручка за период
- `getRevenueChart()` - данные для графика

**FinanceService.java**
- `stats()` - финансовая статистика
  - totalBalance
  - monthlyTopUps
  - monthlyRefunds
  - pendingOperations
  - revenue
  - topUps, refunds

## Навигация

Обновлен файл `/admin/src/layout/AppSidebar.tsx`:
- Добавлен пункт меню "Дешборд" с подменю:
  - "Статистика" (`/`) - главная страница
  - "Аналитика" (`/analytics`) - расширенная аналитика

## Технологический стек

### Frontend:
- **Next.js 14** - React framework
- **TypeScript** - типизация
- **ApexCharts** - графики и диаграммы
- **Tailwind CSS** - стили
- **React Hooks** - управление состоянием

### Backend:
- **Spring Boot** - Java framework
- **JPA/Hibernate** - ORM
- **PostgreSQL** - база данных
- **Spring Security** - аутентификация

## Особенности реализации

### 1. Обработка загрузки
Все компоненты имеют состояния загрузки (loading states):
```tsx
{loading ? (
  <div className="animate-pulse">...</div>
) : (
  <ActualContent />
)}
```

### 2. Обработка ошибок
```tsx
try {
  const data = await analyticsApi.method();
  setData(data);
} catch (error) {
  console.error("Failed to fetch data:", error);
} finally {
  setLoading(false);
}
```

### 3. Адаптивность
Все компоненты адаптивны для мобильных, планшетов и десктопов:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
```

### 4. Темная тема
Поддержка темной темы через Tailwind:
```tsx
className="bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
```

### 5. Интернационализация
Все тексты на русском языке, числа с локализацией:
```tsx
{value.toLocaleString()} ₸
```

## Как использовать

### 1. Запуск проекта

#### Frontend (Admin):
```bash
cd admin
bun install
bun dev
```

#### Backend:
```bash
cd autoparts_backend
./mvnw spring-boot:run
```

### 2. Доступ к страницам

- Главная статистика: `http://localhost:3000/`
- Расширенная аналитика: `http://localhost:3000/analytics`

### 3. Требования

- Node.js 18+
- Bun или npm/yarn
- Java 17+
- PostgreSQL 14+

## Будущие улучшения

### Запланированные функции:

1. **Экспорт данных**
   - Excel
   - PDF
   - CSV

2. **Фильтры**
   - По категориям
   - По клиентам
   - По регионам

3. **Сравнение периодов**
   - Год к году
   - Месяц к месяцу

4. **Прогнозирование**
   - ML модели для прогноза продаж
   - Тренды

5. **Уведомления**
   - Алерты при достижении целей
   - Аномалии в данных

6. **Кастомизация**
   - Настройка дашбордов
   - Сохранение фильтров

## Структура файлов

```
admin/
├── src/
│   ├── app/
│   │   └── (admin)/
│   │       ├── page.tsx                    # Главная статистика
│   │       └── analytics/
│   │           └── page.tsx                # Страница аналитики
│   ├── components/
│   │   ├── analytics/                       # Компоненты аналитики
│   │   │   ├── AnalyticsDashboard.tsx
│   │   │   ├── AnalyticsMetrics.tsx
│   │   │   ├── RevenueChart.tsx
│   │   │   ├── OrdersAnalytics.tsx
│   │   │   ├── FinanceOverview.tsx
│   │   │   ├── TopProductsTable.tsx
│   │   │   ├── CategoryDistribution.tsx
│   │   │   ├── CustomerGrowthChart.tsx
│   │   │   └── SalesHeatmap.tsx
│   │   └── ecommerce/                       # Обновленные компоненты
│   │       ├── EcommerceMetrics.tsx
│   │       ├── MonthlySalesChart.tsx
│   │       └── StatisticsChart.tsx
│   └── lib/
│       └── api/
│           └── analytics.ts                 # API клиент

autoparts_backend/
└── src/main/java/autoparts/kz/modules/
    ├── admin/
    │   ├── controller/
    │   │   └── AdminAnalyticsController.java
    │   ├── service/
    │   │   └── AdminAnalyticsService.java
    │   └── Analytics/
    │       └── controller/
    │           └── AnalyticsController.java
    └── finance/
        └── service/
            └── FinanceService.java
```

## Тестирование

### Ручное тестирование:

1. Проверьте загрузку главной страницы
2. Убедитесь, что данные загружаются из API
3. Проверьте страницу `/analytics`
4. Протестируйте фильтры по датам
5. Проверьте адаптивность на разных экранах
6. Проверьте темную тему

### Автоматическое тестирование (TODO):
- Unit тесты для компонентов
- Integration тесты для API
- E2E тесты

## Поддержка

При возникновении проблем:
1. Проверьте консоль браузера на ошибки
2. Проверьте логи бэкенда
3. Убедитесь, что все зависимости установлены
4. Проверьте подключение к базе данных

## Авторы

- Frontend: React/Next.js разработка
- Backend: Spring Boot интеграция
- Design: UI/UX на основе TailAdmin

## Лицензия

Проект использует существующую лицензию проекта Euroline.
