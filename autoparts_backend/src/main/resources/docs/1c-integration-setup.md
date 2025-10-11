# Интеграция с 1C через RabbitMQ

## Обзор

Данный модуль обеспечивает надежную интеграцию между системой autoparts и 1C через RabbitMQ. Он включает в себя стабильный контракт JSON, систему очередей с обработкой ошибок, мониторинг и автоматические планировщики.

## Архитектура

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Autoparts     │    │    RabbitMQ     │    │       1C        │
│    System       │    │                 │    │     System      │
│                 │    │                 │    │                 │
│  OrderService   │───▶│orders.integ.q   │───▶│  OrderConsumer  │
│  ReturnService  │───▶│returns.integ.q  │───▶│ ReturnConsumer  │
│                 │    │                 │    │                 │
│  QueueMonitor   │◄───│  Queue Stats    │    │                 │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Компоненты

### 1. Контракт интеграции (`OneCIntegrationContract`)
- Стабильная структура JSON сообщений
- Версионирование для обратной совместимости
- Стандартизированные поля для заказов и возвратов

### 2. Маппер контракта (`OneCContractMapper`)
- Преобразование между старыми DTO и новым контрактом
- Обеспечение обратной совместимости
- Валидация данных при маппинге

### 3. Сервис публикации (`OneCIntegrationPublisherService`)
- Публикация сообщений в очереди RabbitMQ
- Поддержка приоритетов и задержек
- Обработка ошибок публикации

### 4. Мониторинг очередей (`OneCQueueMonitoringService`)
- Отслеживание состояния очередей
- Статистика сообщений и потребителей
- Health check для очередей

### 5. Потребители (`OneCIntegrationBridgeConsumer`)
- Обработка сообщений из очередей
- Отправка в REST API 1С
- Retry механизм с DLQ

### 6. Планировщики (`OneCIntegrationScheduler`)
- Автоматическая отправка накопившихся заказов
- Мониторинг здоровья очередей
- Периодическая синхронизация

### 7. REST API (`OneCIntegrationController`)
- Управление интеграцией через HTTP API
- Мониторинг состояния
- Ручной запуск операций

## Настройка

### 1. Настройка RabbitMQ

Убедитесь, что RabbitMQ запущен и доступен:

```bash
# Запуск RabbitMQ с Docker
docker run -d --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=cml \
  -e RABBITMQ_DEFAULT_PASS=cml \
  rabbitmq:3.13-management
```

### 2. Конфигурация приложения

Обновите `application.yml`:

```yaml
spring:
  rabbitmq:
    host: ${RABBIT_HOST:localhost}
    port: ${RABBIT_PORT:5672}
    username: ${RABBIT_USER:cml}
    password: ${RABBIT_PASSWORD:cml}

cml:
  queue:
    exchange: cml.exchange
    orders-integration-routing-key: orders.integration
    returns-integration-routing-key: returns.integration

oneC:
  api:
    url: ${ONEC_API_URL:http://localhost:8081/api/1c}
    username: ${ONEC_USERNAME:admin}
    password: ${ONEC_PASSWORD:password}
```

### 3. Настройка системы 1C

Система 1C должна предоставить следующие эндпоинты:

```
POST /api/1c/orders   - Получение заказов
POST /api/1c/returns  - Получение возвратов
GET  /api/1c/ping     - Проверка соединения
```

## Использование

### 1. Отправка заказа в 1C

```java
@Autowired
private OneCIntegrationPublisherService publisherService;

// Создание сообщения о заказе
OneCOrderMessage orderMessage = new OneCOrderMessage();
// ... заполнение полей

// Публикация в очередь
publisherService.publishOrderMessage(orderMessage);
```

### 2. Отправка возврата в 1C

```java
// Создание сообщения о возврате
OneCReturnMessage returnMessage = new OneCReturnMessage();
// ... заполнение полей

// Публикация в очередь
publisherService.publishReturnMessage(returnMessage);
```

### 3. Мониторинг очередей

```java
@Autowired
private OneCQueueMonitoringService monitoringService;

// Проверка здоровья очередей
boolean healthy = monitoringService.areIntegrationQueuesHealthy();

// Получение статистики
Map<String, QueueStats> stats = monitoringService.getIntegrationQueuesStats();

// Отчет о состоянии
String report = monitoringService.getQueuesHealthReport();
```

## REST API

### Проверка соединения с 1C
```http
GET /api/integration/1c/connection/test
```

### Статистика очередей
```http
GET /api/integration/1c/queues/stats
```

### Проверка здоровья очередей
```http
GET /api/integration/1c/queues/health
```

### Общий статус интеграции
```http
GET /api/integration/1c/status
```

### Запуск синхронизации каталога
```http
POST /api/integration/1c/catalog/sync
```

### Отправка ожидающих заказов
```http
POST /api/integration/1c/orders/send-pending
```

## Очереди RabbitMQ

### Основные очереди
- `orders.integration.q` - Заказы для интеграции с 1C
- `returns.integration.q` - Возвраты для интеграции с 1C

### DLQ очереди
- `orders.integration.q.dlq` - Неудачные заказы
- `returns.integration.q.dlq` - Неудачные возвраты

### Настройки очередей
- **Retry**: 3 попытки с экспоненциальной задержкой
- **TTL**: Нет ограничений по времени жизни
- **DLQ**: Автоматическое перенаправление неудачных сообщений

## Планировщики

### Автоматические задачи
- **Проверка очередей** (каждые 5 минут)
- **Отправка ожидающих заказов** (каждые 15 минут)
- **Проверка соединения с 1C** (каждые 2 минуты)
- **Мониторинг DLQ** (каждые 10 минут)
- **Еженедельная синхронизация каталога** (воскресенье в 02:00)
- **Ежедневная отчетность** (каждый день в 03:00)

### Отключение планировщиков
```yaml
spring:
  task:
    scheduling:
      enabled: false
```

## Обработка ошибок

### Уровни обработки
1. **Application Level**: Валидация данных, бизнес-логика
2. **RabbitMQ Level**: Retry с экспоненциальной задержкой
3. **DLQ Level**: Сбор неудачных сообщений для анализа
4. **Monitoring Level**: Уведомления о проблемах

### Стратегия повторов
```
Попытка 1: Немедленно
Попытка 2: Через 5 секунд
Попытка 3: Через 30 секунд
Если все неудачны: Отправка в DLQ
```

## Мониторинг и алерты

### Метрики
- Количество сообщений в очередях
- Количество потребителей
- Количество неудачных сообщений в DLQ
- Время ответа 1C API

### Алерты
- Накопление сообщений в DLQ (> 0)
- Превышение лимита сообщений в основных очередях (> 1000)
- Недоступность соединения с 1C
- Отсутствие потребителей

## Тестирование

### Запуск тестов
```bash
mvn test -Dtest=OneCIntegrationContractTest
```

### Тестовые сценарии
- Маппинг между DTO и контрактом
- Сериализация/десериализация JSON
- Публикация сообщений в очереди
- Мониторинг состояния очередей
- Обратная совместимость контракта

## Troubleshooting

### Проблема: Сообщения накапливаются в очереди
**Решение**: Проверьте доступность 1C API и логи потребителей

### Проблема: Сообщения попадают в DLQ
**Решение**: Проверьте логи ошибок и структуру сообщений

### Проблема: Планировщики не работают
**Решение**: Убедитесь, что `spring.task.scheduling.enabled=true`

### Проблема: Соединение с RabbitMQ не работает
**Решение**: Проверьте настройки подключения и доступность RabbitMQ

## Логирование

### Уровни логирования
```yaml
logging:
  level:
    autoparts.kz.modules.cml: DEBUG
    autoparts.kz.modules.stockOneC: DEBUG
```

### Важные логи
- Публикация сообщений в очереди
- Обработка сообщений потребителями
- Результаты вызовов 1C API
- Статистика очередей
- Ошибки интеграции

## Безопасность

### Аутентификация в 1C
- Используется Basic Authentication
- Логин и пароль настраиваются через переменные окружения

### Безопасность RabbitMQ
- Отдельный пользователь для CML интеграции
- Ограниченные права доступа к очередям
- Изоляция от других систем

## Производительность

### Рекомендации
- Используйте connection pooling для RabbitMQ
- Настройте подходящий размер пула для REST клиента 1C
- Мониторьте использование памяти при обработке больших сообщений
- Оптимизируйте количество потребителей очередей

### Лимиты
- Максимальный размер сообщения: 1MB
- Максимальное количество попыток: 3
- Таймаут соединения с 1C: 10 секунд

## Версионирование

Текущая версия контракта: **1.0**

При изменении контракта:
1. Обновите версию в `OneCIntegrationContract`
2. Обеспечьте обратную совместимость в маппере
3. Обновите документацию
4. Протестируйте с реальными данными
5. Согласуйте изменения с командой 1C