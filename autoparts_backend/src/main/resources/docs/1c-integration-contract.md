# Контракт интеграции с 1C

## Описание

Данный документ описывает стабильный контракт JSON для интеграции между системой autoparts и 1C через RabbitMQ.

## Версия контракта: 1.0

### Общие принципы

1. **Стабильность**: Контракт обеспечивает обратную совместимость
2. **Версионирование**: Каждое сообщение содержит версию контракта
3. **Надежность**: Использование RabbitMQ с DLQ для обработки ошибок
4. **Мониторинг**: Встроенные механизмы отслеживания состояния очередей

## Очереди RabbitMQ

### Основные очереди
- `orders.integration.q` - Очередь для сообщений о заказах
- `returns.integration.q` - Очередь для сообщений о возвратах

### DLQ очереди (Dead Letter Queues)
- `orders.integration.q.dlq` - Очередь для неудачных сообщений о заказах
- `returns.integration.q.dlq` - Очередь для неудачных сообщений о возвратах

### Routing Keys
- `orders.integration` - Для сообщений о заказах
- `returns.integration` - Для сообщений о возвратах

## Структура сообщений

### Сообщение о заказе

```json
{
  "contract_version": "1.0",
  "message_type": "ORDER",
  "timestamp": "2025-10-11T15:30:00",
  "order_data": {
    "order_id": 12345,
    "external_id": "EXT-12345",
    "public_code": "PUB-12345",
    "created_at": "2025-10-11T15:00:00",
    "confirmed_at": "2025-10-11T15:15:00",
    "status": "CONFIRMED",
    "total_amount": 15000.00,
    "currency": "KZT",
    "delivery_address": "г. Алматы, ул. Абая 100",
    "customer": {
      "id": 67890,
      "email": "customer@example.com",
      "phone": "+7 777 123 4567",
      "client_name": "ТОО Пример",
      "surname": "Иванов",
      "name": "Иван",
      "fathername": "Иванович",
      "company_type": "ТОО",
      "country": "Казахстан",
      "state": "Алматинская область",
      "city": "Алматы",
      "office_address": "ул. Примерная 1"
    },
    "payment": {
      "status": "PAID",
      "amount": 15000.00,
      "payment_method": "CARD"
    },
    "items": [
      {
        "product_id": 111,
        "product_external_code": "EXT-PROD-111",
        "product_code": "PROD-111",
        "product_name": "Тормозные колодки",
        "sku": "TK-001",
        "quantity": 2,
        "price": 7500.00,
        "total_price": 15000.00
      }
    ]
  }
}
```

### Сообщение о возврате

```json
{
  "contract_version": "1.0",
  "message_type": "RETURN",
  "timestamp": "2025-10-11T16:00:00",
  "return_data": {
    "return_id": 98765,
    "order_id": 12345,
    "order_external_id": "EXT-12345",
    "order_public_code": "PUB-12345",
    "customer_id": 67890,
    "status": "PENDING",
    "amount": 7500.00,
    "currency": "KZT",
    "reason": "Брак товара",
    "details": "Обнаружены дефекты при осмотре",
    "created_at": "2025-10-11T16:00:00",
    "updated_at": "2025-10-11T16:00:00",
    "customer": {
      "id": 67890,
      "email": "customer@example.com",
      "phone": "+7 777 123 4567",
      "client_name": "ТОО Пример",
      "surname": "Иванов",
      "name": "Иван",
      "fathername": "Иванович"
    }
  }
}
```

## Поля сообщений

### Общие поля

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| contract_version | String | Да | Версия контракта (текущая: "1.0") |
| message_type | String | Да | Тип сообщения: "ORDER" или "RETURN" |
| timestamp | DateTime | Да | Время создания сообщения (ISO 8601) |

### Поля заказа (order_data)

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| order_id | Long | Да | Внутренний ID заказа |
| external_id | String | Нет | Внешний ID заказа |
| public_code | String | Нет | Публичный код заказа |
| created_at | DateTime | Да | Время создания заказа |
| confirmed_at | DateTime | Нет | Время подтверждения заказа |
| status | String | Да | Статус заказа |
| total_amount | Decimal | Да | Общая сумма заказа |
| currency | String | Да | Валюта (обычно "KZT") |
| delivery_address | String | Нет | Адрес доставки |

### Поля клиента (customer)

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| id | Long | Да | ID клиента |
| email | String | Нет | Email клиента |
| phone | String | Нет | Телефон клиента |
| client_name | String | Нет | Название клиента/компании |
| surname | String | Нет | Фамилия |
| name | String | Нет | Имя |
| fathername | String | Нет | Отчество |
| company_type | String | Нет | Тип компании (ТОО, ИП и т.д.) |
| country | String | Нет | Страна |
| state | String | Нет | Область/регион |
| city | String | Нет | Город |
| office_address | String | Нет | Адрес офиса |

### Поля товара (items)

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| product_id | Long | Да | ID товара |
| product_external_code | String | Нет | Внешний код товара |
| product_code | String | Нет | Код товара |
| product_name | String | Да | Название товара |
| sku | String | Да | Артикул товара |
| quantity | Integer | Да | Количество |
| price | Decimal | Да | Цена за единицу |
| total_price | Decimal | Да | Общая стоимость |

## Статусы

### Статусы заказов
- `PENDING` - Ожидает обработки
- `CONFIRMED` - Подтвержден
- `PROCESSING` - В обработке
- `SHIPPED` - Отправлен
- `DELIVERED` - Доставлен
- `CANCELLED` - Отменен

### Статусы возвратов
- `PENDING` - Ожидает обработки
- `APPROVED` - Одобрен
- `REJECTED` - Отклонен
- `COMPLETED` - Завершен

### Статусы платежей
- `PENDING` - Ожидает оплаты
- `PAID` - Оплачен
- `FAILED` - Ошибка оплаты
- `REFUNDED` - Возвращен

## Обработка ошибок

1. **Retry Policy**: 3 попытки с экспоненциальной задержкой
2. **Dead Letter Queue**: Неудачные сообщения попадают в DLQ
3. **Monitoring**: Автоматический мониторинг состояния очередей
4. **Alerting**: Уведомления о накоплении сообщений в DLQ

## API для мониторинга

### Проверка соединения с 1C
```
GET /api/integration/1c/connection/test
```

### Статистика очередей
```
GET /api/integration/1c/queues/stats
```

### Проверка здоровья очередей
```
GET /api/integration/1c/queues/health
```

### Общий статус интеграции
```
GET /api/integration/1c/status
```

## Настройки конфигурации

```yaml
cml:
  queue:
    exchange: cml.exchange
    orders-integration-routing-key: orders.integration
    returns-integration-routing-key: returns.integration

spring:
  rabbitmq:
    host: localhost
    port: 5672
    username: cml
    password: cml
```

## Требования к системе 1C

### Эндпоинты для получения данных

1. **Получение заказов**
   ```
   POST /api/1c/orders
   Content-Type: application/json
   ```

2. **Получение возвратов**
   ```
   POST /api/1c/returns
   Content-Type: application/json
   ```

3. **Проверка соединения**
   ```
   GET /api/1c/ping
   ```

### Аутентификация
Используется Basic Authentication с настраиваемыми логином и паролем.

## Изменения версий

### Версия 1.0 (текущая)
- Первоначальная версия контракта
- Поддержка заказов и возвратов
- Базовая структура клиента и товаров
- Стандартные поля для интеграции

### Планируемые изменения
- Добавление поддержки частичных возвратов
- Расширение информации о доставке
- Дополнительные поля для аналитики
- Поддержка batch-операций