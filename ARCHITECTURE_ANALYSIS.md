# 🔍 Анализ архитектуры интеграции с 1С и отображения данных

## 📊 Текущая архитектура данных

### 1. **Структура таблиц базы данных**

#### Таблицы 1С (CML - CommerceML)
```
cml_products          - Товары из каталога 1С
  ├─ guid            - Уникальный ID товара в 1С
  ├─ name            - Название
  ├─ sku             - Артикул
  ├─ description     - Описание
  └─ category_id     - Категория

cml_prices           - Цены из 1С
  ├─ product_guid    - Связь с товаром
  ├─ price_type_guid - Тип цены
  ├─ value           - Цена
  └─ currency        - Валюта

cml_stocks           - Остатки на складах
  ├─ product_guid    - Связь с товаром
  ├─ warehouse_guid  - Склад
  └─ quantity        - Количество
```

#### Основная таблица продуктов
```
products             - Основная таблица товаров
  ├─ id             - Internal ID
  ├─ name           - Название
  ├─ code           - Код (SKU)
  ├─ description    - Описание
  ├─ brand          - Бренд
  ├─ external_code  - Связь с 1С (= cml_products.guid)
  ├─ price          - Кэшированная цена из 1С
  ├─ stock          - Кэшированное количество
  ├─ sku            - Артикул
  ├─ imageUrl       - Картинка
  ├─ is_weekly      - Товар недели
  └─ category_id    - Категория
```

### 2. **Синхронизация данных из 1С (каждые 5 минут)**

#### Процесс импорта:
1. **1С отправляет XML** → MinIO → RabbitMQ → Backend
2. **Парсинг XML:**
   - `import.xml` → `cml_products` (каталог товаров)
   - `offers.xml` → `cml_prices` + `cml_stocks` (цены и остатки)
3. **Синхронизация в основную таблицу:**
   ```sql
   ProductSyncService.fullSync() выполняет:
   
   INSERT INTO products (name, code, description, external_code, price, stock)
   SELECT 
       cp.name,
       cp.sku,
       cp.description,
       cp.guid,  -- используется как external_code для связи
       (SELECT pr.value FROM cml_prices pr WHERE pr.product_guid = cp.guid LIMIT 1),
       (SELECT SUM(st.quantity) FROM cml_stocks st WHERE st.product_guid = cp.guid)
   FROM cml_products cp
   ON CONFLICT (external_code) 
   DO UPDATE SET
       name = EXCLUDED.name,
       price = EXCLUDED.price,
       stock = EXCLUDED.stock
   ```

#### Что происходит:
- ✅ Данные из 1С (название, цена, остатки) **автоматически мерджатся** в `products`
- ✅ `external_code` является связующим ключом
- ✅ При повторном импорте данные **обновляются** (ON CONFLICT DO UPDATE)
- ✅ Суммируются остатки со всех складов в одно поле `stock`

### 3. **Отображение данных в фронтенде**

#### А) Основной поиск (`/search`)

**Файлы:**
- `autoparts/components/SearchSection.tsx` - строка поиска
- `autoparts/components/SearchResultsTable.tsx` - таблица результатов

**Что показывается:**
```typescript
interface SearchItem {
  oem: string;           // Артикул
  name: string;          // Название
  brand: string;         // Бренд
  price?: number;        // ✅ ЦЕНА ИЗ 1С
  quantity?: number;     // ✅ КОЛИЧЕСТВО ИЗ 1С
  currency?: string;     // Валюта
  imageUrl?: string;     // Картинка
  warehouses?: Warehouse[]; // ✅ ДЕТАЛИЗАЦИЯ ПО СКЛАДАМ
}
```

**Источник данных:**
- Приходят из API поиска (внешний каталог UMAPI)
- ❗ **НЕ мерджится с данными из `products` таблицы**
- ❗ **НЕ показывает цены/остатки из 1С**

#### Б) Админка (`/admin/products`)

**Файл:** `admin/src/components/products/ProductsTable.tsx`

**Что показывается:**
```typescript
<Table>
  <TableRow>
    <TableCell>{product.name}</TableCell>
    <TableCell>{product.code}</TableCell>
    <TableCell>{formatPrice(product.price)}</TableCell> // ✅ ЦЕНА ИЗ 1С
    <TableCell>{getStockText(product.stock)}</TableCell> // ✅ ОСТАТОК ИЗ 1С
  </TableRow>
</Table>
```

**Источник данных:**
- `/api/products` → `ProductService.getAllPaginated()`
- ✅ **Данные из таблицы `products`**
- ✅ **Цены и остатки УЖЕ синхронизированы из 1С**
- ✅ Дополнительно обогащается через `oneCService.enrichWithOneCData()` (устаревший mock API)

---

## ⚠️ ПРОБЛЕМЫ И НЕСООТВЕТСТВИЯ

### 1. **Поиск НЕ использует данные из 1С**

❌ **Проблема:**
```
Пользователь ищет деталь → находит в UMAPI каталоге 
→ Видит цену и остатки из UMAPI (может быть неактуальной)
→ НЕ видит РЕАЛЬНУЮ цену и остатки из вашей 1С
```

**Почему так происходит:**
- `SearchSection` использует внешний API (UMAPI)
- UMAPI возвращает свои данные (цены, остатки других поставщиков)
- Ваша система НЕ сопоставляет результаты с таблицей `products`

### 2. **Дублирование логики обогащения**

❌ **Проблема:**
```java
// Устаревший mock-сервис
OneCService.enrichWithOneCData() {
  // Обращается к https-1c-mock.free.beeceptor.com
  // Это MOCK, не реальные данные!
}
```

**Что не так:**
- Реальные данные УЖЕ в `products.price` и `products.stock`
- Но код ДОПОЛНИТЕЛЬНО пытается получить данные из mock API
- Mock API не возвращает реальные данные

### 3. **Отсутствие детализации по складам в админке**

❌ **Проблема:**
- В поиске показывается `warehouses[]` (список складов с количеством)
- В админке показывается только `stock` (суммарный остаток)
- Теряется информация о том, на каком складе сколько товара

---

## ✅ РЕШЕНИЕ: Полная интеграция данных

### Архитектура исправлений

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ИМПОРТ ИЗ 1С (каждые 5 минут)                           │
│                                                              │
│  1С XML → MinIO → RabbitMQ → CatalogImportConsumer         │
│     ↓                                                        │
│  Парсинг:                                                    │
│    - import.xml → cml_products                              │
│    - offers.xml → cml_prices + cml_stocks                   │
│     ↓                                                        │
│  ProductSyncService.fullSync():                             │
│    - Мердж в products (название, цена, суммарный остаток)  │
│    ✅ Теперь products.price и products.stock АКТУАЛЬНЫ!     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 2. ПОИСК ТОВАРОВ                                            │
│                                                              │
│  SearchSection → /api/search?q=...                          │
│     ↓                                                        │
│  SearchService:                                             │
│    1. Поиск в UMAPI (внешний каталог)                      │
│    2. ✨ НОВОЕ: Обогащение результатов из products:        │
│       - Найти product по OEM/артикулу                       │
│       - Подставить products.price вместо UMAPI цены        │
│       - Подставить products.stock                           │
│       - Подставить warehouses из cml_stocks                 │
│     ↓                                                        │
│  Результат: Поиск показывает РЕАЛЬНЫЕ цены и остатки из 1С │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 3. АДМИНКА ТОВАРОВ                                          │
│                                                              │
│  ProductsTable → /api/products                              │
│     ↓                                                        │
│  ProductService.getAllPaginated():                          │
│    - Данные из products (УЖЕ с ценами/остатками из 1С)    │
│    - ❌ УБРАТЬ: oneCService.enrichWithOneCData()           │
│       (больше не нужен, данные УЖЕ в БД)                   │
│    - ✨ НОВОЕ: Добавить детализацию по складам:            │
│       SELECT warehouse, quantity FROM cml_stocks            │
│       WHERE product_guid = products.external_code           │
│     ↓                                                        │
│  Результат: Админка показывает детализацию по складам       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 ПЛАН РЕАЛИЗАЦИИ

### Этап 1: Обогащение поиска данными из 1С

**Задача:** При поиске товара подставлять цену и остатки из нашей БД вместо внешнего каталога

**Файлы для изменения:**
1. `SearchService.java` - добавить метод обогащения результатов
2. `ProductRepository.java` - добавить поиск по артикулу
3. `SearchResponse` DTO - добавить поле `priceFrom1C`, `stockFrom1C`

**Логика:**
```java
// После получения результатов из UMAPI
List<SearchItem> umapiResults = umapiClient.search(query);

// Обогащаем каждый результат данными из 1С
for (SearchItem item : umapiResults) {
    // Ищем товар в нашей БД по артикулу
    Optional<Product> ourProduct = productRepository
        .findByCodeOrSku(item.getOem());
    
    if (ourProduct.isPresent()) {
        Product p = ourProduct.get();
        
        // Подставляем НАШИ цены и остатки
        item.setPriceFrom1C(p.getPrice());
        item.setStockFrom1C(p.getStock());
        
        // Детализация по складам
        List<CmlStock> stocks = cmlStockRepository
            .findByProductGuid(p.getExternalCode());
        item.setWarehouses(mapToWarehouseDTOs(stocks));
    }
}
```

### Этап 2: Детализация по складам в админке

**Задача:** Показывать не только суммарный остаток, но и по каждому складу

**Файлы для изменения:**
1. `ProductResponse.java` - добавить `List<WarehouseStock> warehouses`
2. `ProductService.java` - при формировании ответа добавлять склады
3. `ProductsTable.tsx` - отображать раскрывающуюся таблицу складов

**Структура данных:**
```java
@Data
public class ProductResponse {
    private Long id;
    private String name;
    private String code;
    private Integer price;      // Суммарный остаток (для быстрого отображения)
    private Integer stock;      // Суммарный остаток
    
    // ✨ НОВОЕ
    private List<WarehouseStock> warehouses;  // Детализация по складам
}

@Data
public class WarehouseStock {
    private String warehouseGuid;
    private String warehouseName;
    private BigDecimal quantity;
}
```

### Этап 3: Удаление устаревшего mock-сервиса

**Задача:** Убрать `OneCService.enrichWithOneCData()` так как данные УЖЕ в БД

**Файлы для изменения:**
1. `ProductService.java` - удалить вызовы `.map(p -> oneCService.enrichWithOneCData(p).orElse(p))`
2. `OneCService.java` - пометить как `@Deprecated` или удалить

**Было:**
```java
return productRepository.findAll(PageRequest.of(page, size))
    .map(this::toResponse)
    .map(p -> oneCService.enrichWithOneCData(p).orElse(p)); // ❌ Лишний вызов
```

**Станет:**
```java
return productRepository.findAll(PageRequest.of(page, size))
    .map(this::toResponse); // ✅ Данные УЖЕ в БД
```

---

## 📈 ИТОГОВАЯ СХЕМА ДАННЫХ

```
┌─────────────────────────────────────────────────────────────────────┐
│ ЕДИНАЯ ИСТИНА ИСТОЧНИК: 1С                                          │
│                                                                      │
│ 1С отправляет XML каждые 5 минут:                                   │
│   • Каталог товаров → cml_products                                  │
│   • Цены           → cml_prices                                     │
│   • Остатки        → cml_stocks                                     │
│                                                                      │
│ ProductSyncService автоматически:                                   │
│   • Мерджит в products (название, цена, суммарный остаток)         │
│   • Обновляет при каждом импорте (ON CONFLICT DO UPDATE)           │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ ВСЕ API ИСПОЛЬЗУЮТ ДАННЫЕ ИЗ products                               │
│                                                                      │
│ 1. /api/products (админка)                                          │
│    ✅ Показывает: price, stock, warehouses[]                        │
│                                                                      │
│ 2. /api/search (главный поиск)                                      │
│    ✅ Обогащается данными из products:                              │
│       - Цена из 1С (вместо внешнего каталога)                      │
│       - Остатки из 1С                                               │
│       - Детализация по складам                                      │
│                                                                      │
│ 3. /api/products/{id} (карточка товара)                            │
│    ✅ Показывает актуальные данные из products                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ✅ ВЫВОД И РЕКОМЕНДАЦИИ

### Текущее состояние:
1. ✅ **Импорт из 1С работает** - данные каждые 5 минут обновляются
2. ✅ **Синхронизация в products работает** - цены и остатки мерджатся
3. ✅ **Админка показывает данные из 1С** - берет из таблицы products
4. ❌ **Поиск НЕ использует данные из 1С** - показывает данные внешнего каталога
5. ⚠️ **Нет детализации по складам** - только суммарный остаток

### Что нужно сделать:

**Приоритет 1 (КРИТИЧНО):**
- ✅ Обогатить результаты поиска данными из `products` таблицы
- ✅ Подставлять РЕАЛЬНЫЕ цены и остатки из 1С вместо внешнего каталога

**Приоритет 2 (ВАЖНО):**
- ✅ Добавить детализацию по складам (`cml_stocks`) во все API
- ✅ Показывать в админке и в поиске на каких складах сколько товара

**Приоритет 3 (ОПТИМИЗАЦИЯ):**
- ✅ Убрать `OneCService.enrichWithOneCData()` - данные УЖЕ в БД
- ✅ Упростить код `ProductService` - убрать лишние вызовы

---

**Хотите, чтобы я начал реализацию?** 

Я могу:
1. Создать `ProductEnrichmentService` для обогащения поиска данными из 1С
2. Добавить детализацию по складам в `ProductResponse`
3. Обновить фронтенд для отображения складов
4. Убрать устаревший mock-сервис

**С чего начать?** 🚀
