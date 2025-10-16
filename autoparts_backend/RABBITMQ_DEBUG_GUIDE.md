# RabbitMQ Consumer Debugging Guide

## Проблема
В очереди `orders.export.q` накопилось **690 сообщений**, но consumer их не обрабатывает.

## Что мы сделали

### 1. Добавили детальное логирование
- ✅ `OrdersExportConsumer` теперь логирует инициализацию
- ✅ `JobQueue` логирует детали публикации сообщений
- ✅ Добавлен error handler в `RabbitConfig`
- ✅ Включено DEBUG логирование для Spring AMQP

### 2. Создали тестовый consumer
- ✅ `TestOrdersConsumer` - слушает ту же очередь `orders.export.q`
- ✅ Логирует RAW сообщения для диагностики

### 3. Добавили диагностические endpoints

#### Просмотр информации о очередях
```bash
curl http://localhost:8080/api/diagnostic/rabbitmq/queue-info
```

#### Посмотреть сообщение в DLQ (без удаления)
```bash
curl http://localhost:8080/api/diagnostic/rabbitmq/peek-dlq
```

#### Статус listeners
```bash
curl http://localhost:8080/api/diagnostic/rabbitmq/listener-status
```

#### Ручной триггер экспорта (для теста)
```bash
curl -X POST http://localhost:8080/api/diagnostic/trigger-order-export
```

## Что нужно проверить после запуска

### Шаг 1: Проверить логи при старте приложения
Ищите в логах:
```
🚀 OrdersExportConsumer initialized
✅ OrdersExportConsumer PostConstruct completed
🧪 TestOrdersConsumer CREATED
```

### Шаг 2: Проверить, обрабатываются ли сообщения
После запуска приложения должны появиться логи:
```
🧪🧪🧪 TEST CONSUMER RECEIVED MESSAGE!
📥 RECEIVED message in OrdersExportConsumer
```

Если `TestOrdersConsumer` получает сообщения, а `OrdersExportConsumer` нет - проблема в десериализации `ExchangeJob`.

### Шаг 3: Проверить DLQ
```bash
curl http://localhost:8080/api/diagnostic/rabbitmq/peek-dlq
```

Это покажет сообщение, которое не смогло обработаться, и его error headers.

### Шаг 4: Проверить лог ошибок
Ищите в логах:
```
❌ RabbitMQ Listener Error:
```

## Возможные причины проблемы

### 1. Десериализация ExchangeJob
Если Jackson не может десериализовать record, нужно добавить:
```java
@JsonCreator
public record ExchangeJob(...)
```

### 2. Consumer не стартует
- Проверить что `@EnableRabbit` есть
- Проверить что `rabbitListenerContainerFactory` создается
- Проверить логи Spring при старте

### 3. Проблема с подключением к RabbitMQ
- Проверить что очереди существуют
- Проверить bindings между exchange и queue
- Проверить routing key

## Следующие шаги

1. **Запустите приложение** и соберите логи
2. **Вызовите** `/api/diagnostic/rabbitmq/peek-dlq` чтобы увидеть ошибку
3. **Проверьте** появляются ли логи от `TestOrdersConsumer`
4. **Отправьте** мне логи для дальнейшего анализа

## Важные изменения в коде

### RabbitConfig.java
- Добавлен `AmqpAdmin` bean
- Добавлен error handler в listener container factory
- Включено детальное логирование ошибок

### application.yml
- Добавлено DEBUG логирование для `org.springframework.amqp`

### Новые файлы
- `DiagnosticController.java` - ручной триггер экспорта
- `RabbitMqDiagnosticController.java` - диагностика RabbitMQ
- `TestOrdersConsumer.java` - тестовый consumer для отладки
