# RabbitMQ Consumer Debug Guide

## Проблема
В очереди `orders.export.q` накопилось **690 сообщений**, но consumer их не обрабатывает.

## Диагностика

### 1. Проверить логи при старте приложения

Запустите приложение и найдите в логах:
```bash
# Должны быть эти логи:
🚀 OrdersExportConsumer initialized and ready to consume from 'orders.export.q'
✅ OrdersExportConsumer PostConstruct completed - listener should be registered now

# Если их НЕТ - значит consumer не создается
```

### 2. Проверить RabbitMQ подключение

```bash
# В логах при старте должно быть:
Created new connection: rabbitConnectionFactory#...
Channel shutdown: channel error
```

### 3. Проверить регистрацию listener

```bash
# В DEBUG логах должно быть что-то типа:
Registering listener on queue 'orders.export.q'
SimpleMessageListenerContainer started
```

### 4. Вручную очистить DLQ и проверить ошибки

Зайдите в RabbitMQ Management UI:
1. Перейдите в очередь `orders.export.q.dlq`
2. Нажмите "Get Message(s)"
3. Посмотрите заголовок `x-exception-message` - там будет причина ошибки
4. Посмотрите тело сообщения - возможно проблема в десериализации

### 5. Тестовый эндпоинт

Используйте диагностический эндпоинт для отправки тестового сообщения:

```bash
curl -X POST http://localhost:8080/api/diagnostic/trigger-order-export
```

После этого проверьте логи:
```bash
# Должно появиться:
📤 Publishing job ORDERS_EXPORT for file orders.xml
📤 Message sent successfully to exchange 'cml.exchange' with routing key 'orders.export'
📥 RECEIVED message in OrdersExportConsumer: requestId=...
```

### 6. Проверить конфигурацию

```bash
# В application.yml должно быть:
cml:
  queue:
    exchange: cml.exchange
    orders-export-routing-key: orders.export

spring:
  rabbitmq:
    host: localhost
    port: 5672
    username: guest
    password: guest
```

## Возможные причины проблемы

### Причина 1: Consumer не стартует
**Проверка:** Нет логов `🚀 OrdersExportConsumer initialized`
**Решение:** Проверить, что класс помечен `@Component` и находится в правильном пакете

### Причина 2: Ошибка десериализации ExchangeJob
**Проверка:** Сообщения в DLQ с ошибкой типа "Cannot deserialize"
**Решение:** Проверить, что ExchangeJob record совместим с Jackson

### Причина 3: RabbitMQ listener не подключается к очереди
**Проверка:** В DEBUG логах нет "Registering listener on queue"
**Решение:** Проверить, что очередь существует ДО старта listener

### Причина 4: Ошибка в коде consumer
**Проверка:** Сообщения в DLQ, в логах есть stacktrace
**Решение:** Исправить ошибку в OrdersExportService.exportOrders()

### Причина 5: IdempotencyGuard блокирует обработку
**Проверка:** Логи "Skip duplicate orders export"
**Решение:** Очистить Redis/кеш или изменить логику idempotency

## Команды для очистки очередей

```bash
# Очистить все сообщения из orders.export.q (через RabbitMQ CLI)
rabbitmqadmin purge queue name=orders.export.q

# Или через Management UI:
# Queues → orders.export.q → Purge Messages
```

## Следующие шаги

1. ✅ Добавлены расширенные логи в OrdersExportConsumer
2. ✅ Добавлен DEBUG уровень для org.springframework.amqp
3. ✅ Создан диагностический эндпоинт /api/diagnostic/trigger-order-export
4. 🔄 Перезапустить приложение
5. 🔄 Проверить логи при старте
6. 🔄 Вызвать тестовый эндпоинт
7. 🔄 Проверить, обработалось ли сообщение

## Временное решение (если consumer работает, но очередь забита)

```bash
# Очистить очередь и DLQ
curl -u guest:guest -X DELETE http://localhost:15672/api/queues/%2F/orders.export.q/contents
curl -u guest:guest -X DELETE http://localhost:15672/api/queues/%2F/orders.export.q.dlq/contents
```
