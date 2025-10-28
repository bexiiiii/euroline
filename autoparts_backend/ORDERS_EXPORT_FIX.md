# ✅ Решение проблемы "Orders Export возвращает null"

## 🔍 Диагностика

**Проблема:** `OrdersExportService.exportOrders()` возвращает `null`

**Причина:** В базе данных нет заказов со статусом `NEW`

**Текущее состояние:**
```sql
SELECT id, number, status, created_at 
FROM cml_orders 
WHERE id = 1;
```
Результат: `status = 'CONFIRMED'` ❌

## 📋 Жизненный цикл статусов CmlOrder

```
NEW → CONFIRMED → PAID → SHIPPED → COMPLETED
                              ↓
                         CANCELLED / RETURNED
```

**Логика экспорта:**
- ✅ `NEW` - Заказ создан, **БУДЕТ экспортирован** в 1С
- ❌ `CONFIRMED` - Заказ уже отправлен в 1С, **НЕ экспортируется повторно**
- ❌ `PAID/SHIPPED/COMPLETED` - Финальные статусы, не экспортируются

## ✅ Решение 1: Создать новый тестовый заказ

```bash
# Выполнить SQL скрипт
psql -U your_user -d autoparts -f create-test-order.sql
```

Или напрямую в БД:
```sql
INSERT INTO cml_orders (
    guid, number, created_at, status, total,
    customer_guid, customer_name, customer_email, customer_phone,
    customer_country, customer_city, customer_address, customer_client_name
) VALUES (
    gen_random_uuid(),
    'TEST-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS'),
    NOW(),
    'NEW',  -- ✅ Ключевой параметр!
    25000.00,
    gen_random_uuid(),
    'Петров Сергей Александрович',
    'petrov.sergey@example.com',
    '+77012345678',
    'Казахстан',
    'Астана',
    'Казахстан, Астана, пр. Кабанбай батыра 53, офис 201',
    'ТОО "Автозапчасти Плюс"'
);
```

## ✅ Решение 2: Сбросить статус существующего заказа

**⚠️ ТОЛЬКО ДЛЯ ТЕСТИРОВАНИЯ!**

```bash
# Выполнить SQL скрипт
psql -U your_user -d autoparts -f reset-order-status.sql
```

Или напрямую:
```sql
-- Сбросить конкретный заказ
UPDATE cml_orders 
SET status = 'NEW'
WHERE id = 1;

-- Проверка
SELECT id, number, status, created_at 
FROM cml_orders 
WHERE status = 'NEW';
```

## 🧪 Тестирование после исправления

### 1. Проверить наличие NEW заказов
```sql
SELECT COUNT(*) as new_orders_count
FROM cml_orders 
WHERE status = 'NEW';
```
Ожидаемый результат: `> 0`

### 2. Запустить экспорт вручную (если нужно)
```bash
# Через API (требует авторизацию 1С)
curl -u 1c_exchange:234Euroline456 \
  "https://api.euroline.1edu.kz/api/1c-exchange?type=sale&mode=query"
```

### 3. Проверить логи backend
```bash
tail -f logs/application.log | grep "orders to export"
```

Ожидаемый лог:
```
📦 Found 1 NEW orders to export (requestId: xxx)
✅ Exported 1 orders to MinIO: commerce-ml/outbox/orders/2025/10/28/orders_xxx.xml
Marked 1 orders as CONFIRMED (exported to 1C)
```

### 4. Проверить MinIO
```bash
# Проверить, что XML файл создан
# Путь: commerce-ml/outbox/orders/YYYY/MM/DD/orders_*.xml
```

### 5. Проверить, что статус изменился
```sql
SELECT id, number, status, created_at 
FROM cml_orders 
WHERE id = 1;
```
Ожидаемый результат после экспорта: `status = 'CONFIRMED'` ✅

## 📊 Итоговая логика

### До исправления:
```
1. OrdersExportService.exportOrders()
2. Ищет заказы: status = 'NEW'
3. Находит: 0 заказов
4. Возвращает: null ❌
5. 1С получает: пустой ответ
```

### После исправления:
```
1. Создан новый заказ: status = 'NEW' ✅
2. OrdersExportService.exportOrders()
3. Находит: 1 заказ
4. Генерирует XML
5. Сохраняет в MinIO: commerce-ml/outbox/orders/.../orders_xxx.xml
6. Обновляет статус: NEW → CONFIRMED
7. Возвращает: путь к файлу ✅
8. 1С скачивает XML с заказом
```

## 🔄 Автоматическое создание CmlOrder

При создании нового заказа через `OrderService.createOrder()`:
```java
// Автоматически создается CmlOrder со статусом NEW
CmlOrder cmlOrder = orderToCmlConverter.toCmlOrder(order);
cmlOrder.setStatus(CmlOrderStatus.NEW);  // ✅
cmlOrderRepository.save(cmlOrder);
```

**Проверьте:**
- OrderService правильно создает CmlOrder
- Статус устанавливается в `NEW`, а не `CONFIRMED`

## ⚙️ Настройка интервала экспорта

```yaml
# application-prod.yml
cml:
  orders-export-interval-ms: 300000  # 5 минут (по умолчанию)
```

Для более частого экспорта (тестирование):
```yaml
cml:
  orders-export-interval-ms: 60000  # 1 минута
```

## 🚀 Следующие шаги

1. ✅ **Создать NEW заказ** (используя один из SQL скриптов)
2. ✅ **Перезапустить backend** (если изменили interval)
3. ✅ **Дождаться следующего цикла экспорта** (или вызвать вручную)
4. ✅ **Проверить логи** - должно быть "Found N NEW orders to export"
5. ✅ **Проверить MinIO** - должен появиться XML файл
6. ✅ **Настроить 1С** - указать правильный URL и credentials
7. ✅ **Запустить обмен в 1С** - должен получить заказ

## ⚠️ Важно!

После того, как заказ экспортирован (статус стал `CONFIRMED`), он **НЕ** будет экспортироваться повторно. Это предотвращает дублирование заказов в 1С.

Если нужно повторно отправить заказ:
- Сбросить статус на `NEW` вручную (через SQL)
- Или создать новый заказ
