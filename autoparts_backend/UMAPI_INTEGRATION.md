# 🚗 UMAPI.ru Integration Documentation

## 📋 Обзор

Полная интеграция с **UMAPI.ru** - мощным API для автозапчастей, предоставляющим:
- 🔍 Подбор запчастей по автомобилю (марка → модель → модификация)
- 🔄 Поиск аналогов и кроссов
- 📊 Полная база OEM кодов
- 🏷️ Детальная информация о запчастях

---

## 🎯 Возможности

### 1. Каталог автомобилей
- Поиск производителей (легковые, коммерческие, мотоциклы)
- Список моделей по производителю
- Модификации с полными характеристиками (двигатель, мощность, тип кузова)
- Категории запчастей для конкретной модификации

### 2. Поиск запчастей
- Поиск по артикулу с уточнением бренда
- Получение аналогов (OE, OEM, Aftermarket)
- Информация о применяемости
- Технические характеристики

### 3. Кэширование
- Производители: **24 часа**
- Модели/Модификации: **24 часа**
- Категории: **6 часов**
- Продукты/Артикулы: **1 час**
- Аналоги: **6 часов**

---

## ⚙️ Конфигурация

### application.yml
```yaml
umapi:
  base-url: https://api.umapi.ru
  api-key: b9a8ccd2-40b1-4e94-9d34-31674c64649f
  default-language: ru
  default-region: RU
  timeout:
    connect: 5000  # 5 seconds
    read: 10000    # 10 seconds
  retry:
    max-attempts: 3
    backoff-delay: 1000
```

### Переменные окружения
```bash
UMAPI_API_KEY=your-api-key-here
UMAPI_BASE_URL=https://api.umapi.ru
UMAPI_LANGUAGE=ru
UMAPI_REGION=RU
```

---

## 🔌 API Endpoints

### Vehicle Catalog API

#### 1. Получить производителей легковых авто
```http
GET /api/vehicle-catalog/manufacturers
```

**Response:**
```json
[
  {
    "id": 116,
    "name": "TOYOTA",
    "vehicleType": "P"
  },
  {
    "id": 13,
    "name": "BMW",
    "vehicleType": "P"
  }
]
```

#### 2. Получить модели
```http
GET /api/vehicle-catalog/models?manufacturerId=116&vehicleType=P
```

**Response:**
```json
[
  {
    "id": 2345,
    "name": "Camry",
    "manufacturerId": 116,
    "manufacturerName": "TOYOTA",
    "yearFrom": 2011,
    "yearTo": 2017
  }
]
```

#### 3. Получить модификации
```http
GET /api/vehicle-catalog/modifications?modelId=2345
```

**Response:**
```json
[
  {
    "id": 12345,
    "name": "Camry 2.5 VVT-i (181 HP)",
    "modelId": 2345,
    "manufacturerId": 116,
    "manufacturerName": "TOYOTA",
    "yearFrom": 2011,
    "yearTo": 2017,
    "engineCapacity": 2494,
    "powerKw": 133,
    "powerHp": 181,
    "fuelType": "Petrol",
    "engineCode": "2AR-FE",
    "bodyType": "Sedan",
    "driveType": "FWD"
  }
]
```

#### 4. Получить категории запчастей
```http
GET /api/vehicle-catalog/categories?modificationId=12345
```

**Response:**
```json
[
  {
    "id": 100,
    "name": "Двигатель",
    "parentId": null,
    "productCount": 250
  },
  {
    "id": 101,
    "name": "Масляные фильтры",
    "parentId": 100,
    "productCount": 15
  }
]
```

#### 5. Получить продуктовые группы
```http
GET /api/vehicle-catalog/products?categoryId=101&modificationId=12345
```

**Response:**
```json
[
  {
    "id": 5001,
    "name": "Масляный фильтр двигателя",
    "genericArticles": ["90915-YZZD2", "90915-10003"],
    "articleCount": 45,
    "suppliers": [
      {
        "id": 12,
        "name": "BOSCH"
      },
      {
        "id": 45,
        "name": "MANN-FILTER"
      }
    ]
  }
]
```

#### 6. Получить артикулы
```http
GET /api/vehicle-catalog/articles?productId=5001&modificationId=12345
```

**Response:**
```json
[
  {
    "id": 789012,
    "articleNumber": "0986452041",
    "supplierId": 12,
    "supplierName": "BOSCH",
    "name": "Oil Filter",
    "genericArticleNumber": "90915-YZZD2",
    "oeNumbers": ["90915-YZZD2", "90915-10003"],
    "tradeNumbers": ["P7041"],
    "eanNumbers": ["4047024549685"],
    "criteria": [
      {
        "id": 1,
        "name": "Height",
        "value": "88",
        "unit": "mm"
      },
      {
        "id": 2,
        "name": "Outer Diameter",
        "value": "76",
        "unit": "mm"
      }
    ],
    "images": [
      "https://api.umapi.ru/images/0986452041.jpg"
    ],
    "documents": []
  }
]
```

---

### Parts Search API

#### 1. Поиск по артикулу (уточнение бренда)
```http
GET /api/parts-search/by-article?article=0986452041
```

**Response:**
```json
{
  "articleNumber": "0986452041",
  "suppliers": [
    {
      "id": 12,
      "name": "BOSCH",
      "matchType": "EXACT",
      "articleCount": 1
    },
    {
      "id": 156,
      "name": "BLUE PRINT",
      "matchType": "OE",
      "articleCount": 1
    }
  ]
}
```

#### 2. Получить аналоги
```http
GET /api/parts-search/analogs?article=0986452041&brand=BOSCH
```

**Response:**
```json
{
  "originalArticle": "0986452041",
  "originalSupplier": "BOSCH",
  "analogs": [
    {
      "articleNumber": "W712/75",
      "supplierId": 25,
      "supplierName": "MANN-FILTER",
      "name": "Oil Filter",
      "matchType": "OE",
      "quality": "OEM",
      "available": true
    },
    {
      "articleNumber": "PH5796",
      "supplierId": 89,
      "supplierName": "FRAM",
      "name": "Oil Filter",
      "matchType": "SIMILAR",
      "quality": "Aftermarket",
      "available": true
    }
  ]
}
```

---

## 💻 Примеры использования

### Java Service Layer

```java
@Service
@RequiredArgsConstructor
public class MyService {
    
    private final UmapiIntegrationService umapiService;
    
    public void example() {
        // 1. Получить производителей
        List<ManufacturerDto> manufacturers = umapiService.getPassengerManufacturers();
        
        // 2. Получить модели Toyota
        List<ModelSeriesDto> models = umapiService.getModels(116L, "P");
        
        // 3. Получить модификации Camry
        List<ModificationDto> modifications = umapiService.getPassengerModifications(2345L);
        
        // 4. Поиск по артикулу
        BrandRefinementDto brands = umapiService.searchByArticle("0986452041");
        
        // 5. Получить аналоги
        AnalogDto analogs = umapiService.getAnalogs("0986452041", "BOSCH");
    }
}
```

### Frontend (JavaScript/TypeScript)

```typescript
// 1. Получить производителей
const manufacturers = await fetch('/api/vehicle-catalog/manufacturers')
  .then(res => res.json());

// 2. Получить модели
const models = await fetch(
  `/api/vehicle-catalog/models?manufacturerId=116&vehicleType=P`
).then(res => res.json());

// 3. Поиск по артикулу
const brands = await fetch(
  `/api/parts-search/by-article?article=0986452041`
).then(res => res.json());

// 4. Получить аналоги
const analogs = await fetch(
  `/api/parts-search/analogs?article=0986452041&brand=BOSCH`
).then(res => res.json());
```

---

## 🎨 UI Flow (Рекомендуемый)

### Сценарий 1: Подбор по автомобилю
```
1. Пользователь выбирает "Подбор по автомобилю"
   ↓
2. GET /manufacturers → Список производителей (Toyota, BMW, Mercedes...)
   ↓
3. Пользователь выбирает "Toyota"
   ↓
4. GET /models?manufacturerId=116 → Список моделей (Camry, Corolla...)
   ↓
5. Пользователь выбирает "Camry"
   ↓
6. GET /modifications?modelId=2345 → Список модификаций с годами и двигателями
   ↓
7. Пользователь выбирает "Camry 2.5 VVT-i 2015"
   ↓
8. GET /categories?modificationId=12345 → Категории запчастей (Двигатель, Тормоза...)
   ↓
9. Пользователь выбирает "Масляные фильтры"
   ↓
10. GET /products?categoryId=101&modificationId=12345 → Продуктовые группы
    ↓
11. GET /articles?productId=5001&modificationId=12345 → Конкретные артикулы
    ↓
12. Показать список запчастей с ценами из вашей базы
```

### Сценарий 2: Поиск по артикулу
```
1. Пользователь вводит артикул "0986452041"
   ↓
2. GET /parts-search/by-article?article=0986452041
   ↓
3. Показать список брендов (BOSCH, MANN-FILTER...)
   ↓
4. Пользователь выбирает "BOSCH" или "Показать все аналоги"
   ↓
5. GET /parts-search/analogs?article=0986452041&brand=BOSCH
   ↓
6. Показать оригинал + список аналогов с ценами
```

---

## 🔧 Обработка ошибок

### Exception Types

1. **UmapiConnectionException** - Проблемы с подключением к UMAPI
   - HTTP 503 Service Unavailable
   - Автоматический retry (3 попытки)

2. **UmapiApiException** - Ошибки API (неверные параметры, лимиты)
   - HTTP 400 Bad Request / 502 Bad Gateway
   - Включает statusCode от UMAPI

3. **UmapiException** - Общие ошибки интеграции
   - HTTP 500 Internal Server Error

### Примеры ответов

```json
{
  "error": "umapi_connection_error",
  "message": "Не удалось подключиться к UMAPI: Connection timeout"
}
```

```json
{
  "error": "umapi_api_error",
  "message": "Invalid manufacturer ID",
  "statusCode": 404
}
```

---

## 📊 Производительность

### Кэширование Redis

| Операция | TTL | Размер | Примечание |
|----------|-----|--------|------------|
| Manufacturers | 24h | ~50KB | Почти статичные данные |
| Models | 24h | ~200KB | Редко обновляются |
| Modifications | 24h | ~500KB | Детальная информация |
| Categories | 6h | ~100KB | Периодические обновления |
| Products | 1h | ~300KB | Частые изменения |
| Articles | 1h | ~1MB | Частые изменения |
| Brand Search | 6h | ~10KB | Стабильные результаты |
| Analogs | 6h | ~50KB | Стабильные кроссы |

### Expected Performance

- **Первый запрос** (cache miss): ~200-500ms (UMAPI API call)
- **Последующие запросы** (cache hit): **~5-10ms** (Redis)
- **Cache Hit Rate**: **80-90%** (после прогрева)

---

## 🚀 Deployment

### 1. Проверить конфигурацию
```bash
# В application-prod.yml убедитесь что настроены:
umapi.api-key=your-production-key
umapi.base-url=https://api.umapi.ru
```

### 2. Пересобрать проект
```bash
cd /Users/behruztohtamishov/euroline/autoparts_backend
mvn clean package -DskipTests
```

### 3. Запустить
```bash
java -jar target/autoparts-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

### 4. Проверить работу
```bash
# Swagger UI
open http://localhost:8080/swagger-ui.html

# Тест производителей
curl http://localhost:8080/api/vehicle-catalog/manufacturers

# Тест поиска
curl "http://localhost:8080/api/parts-search/by-article?article=0986452041"
```

---

## 🧪 Testing

### Postman Collection

```json
{
  "info": {
    "name": "UMAPI Integration",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get Manufacturers",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/vehicle-catalog/manufacturers"
      }
    },
    {
      "name": "Get Models",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/api/vehicle-catalog/models?manufacturerId=116&vehicleType=P",
          "query": [
            {"key": "manufacturerId", "value": "116"},
            {"key": "vehicleType", "value": "P"}
          ]
        }
      }
    },
    {
      "name": "Search by Article",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/api/parts-search/by-article?article=0986452041",
          "query": [
            {"key": "article", "value": "0986452041"}
          ]
        }
      }
    }
  ]
}
```

---

## 📈 Мониторинг

### Метрики для отслеживания

1. **UMAPI API Response Time**
   - Нормально: < 500ms
   - Внимание: > 1000ms

2. **Cache Hit Rate**
   - Цель: > 80%
   - Минимум: > 60%

3. **Error Rate**
   - Нормально: < 1%
   - Критично: > 5%

### Логи

```bash
# Успешные запросы
2025-10-15 INFO  UmapiClient - Fetching manufacturers for vehicle type: P

# Кэш хиты
2025-10-15 DEBUG UmapiIntegrationService - Cache hit for manufacturers: P

# Ошибки
2025-10-15 ERROR UmapiClient - UMAPI error: 429 - Rate limit exceeded
```

---

## 🎯 Best Practices

### 1. Нормализация артикулов
```java
// ПРАВИЛЬНО ✅
String normalized = articleNumber.replaceAll("[\\s-]", "").toUpperCase();
// "098 645-2041" → "0986452041"

// НЕПРАВИЛЬНО ❌
String raw = articleNumber; // "098 645-2041" → не найдёт
```

### 2. Обработка пустых результатов
```java
List<ManufacturerDto> manufacturers = umapiService.getPassengerManufacturers();
if (manufacturers == null || manufacturers.isEmpty()) {
    // Показать "Производители не найдены"
}
```

### 3. Пользовательский опыт
- Показывайте лоадеры при первом запросе (cache miss)
- Отображайте количество результатов
- Добавьте фильтры по годам, типу кузова, двигателю

---

## 🔗 Полезные ссылки

- [UMAPI.ru Documentation](https://api.umapi.ru/documentation)
- [Spring Cache Documentation](https://docs.spring.io/spring-framework/docs/current/reference/html/integration.html#cache)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)

---

## ✅ Чек-лист готовности

- [x] Конфигурация в application.yml
- [x] DTOs созданы
- [x] UmapiClient с retry logic
- [x] UmapiIntegrationService с кэшированием
- [x] REST Controllers
- [x] Exception handlers
- [x] Redis cache configuration
- [x] Документация
- [ ] Unit тесты (опционально)
- [ ] Integration тесты (опционально)

---

**Статус:** ✅ ГОТОВО К PRODUCTION  
**Дата:** 2025-10-15  
**Версия:** 1.0.0
