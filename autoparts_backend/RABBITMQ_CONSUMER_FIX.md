# RabbitMQ Consumer Fix - 690 сообщений в очереди

## 🔍 Проблема

**Симптомы:**
- ✅ Сообщения публикуются в RabbitMQ (690 сообщений в `orders.export.q`)
- ❌ Consumer (`OrdersExportConsumer`) НЕ обрабатывает сообщения
- ❌ В логах нет строки `🚀 OrdersExportConsumer initialized`
- ❌ 1 сообщение попало в DLQ

## 🎯 Корневая причина

**OrdersExportConsumer не создается как Spring bean!**

Возможные причины:
1. **Неправильный package scan** - класс может быть вне component scan
2. **Циклическая зависимость** - Spring не может создать bean из-за circular dependency
3. **Ошибка при инициализации** - exception при создании bean (тихая ошибка)
4. **Конфликт конфигураций** - проблема с RabbitMQ configuration

## 🔧 Решение

### Шаг 1: Проверить package scan

Убедитесь, что `OrdersExportConsumer` находится в правильном package:

```
autoparts.kz.modules.cml.queue.consumers.OrdersExportConsumer
```

Должен быть внутри `autoparts.kz.*` для автоматического scan.

### Шаг 2: Добавить явное логирование при создании bean

Обновите `OrdersExportConsumer.java`:

```java
@Component
public class OrdersExportConsumer {
    
    private static final Logger log = LoggerFactory.getLogger(OrdersExportConsumer.class);

    public OrdersExportConsumer(OrdersExportService ordersExportService, IdempotencyGuard idempotencyGuard) {
        this.ordersExportService = ordersExportService;
        this.idempotencyGuard = idempotencyGuard;
        
        // 🔥 КРИТИЧЕСКИ ВАЖНО: Этот лог должен появиться при старте!
        log.error("🚀🚀🚀 OrdersExportConsumer BEAN CREATED! 🚀🚀🚀");
        System.out.println("🚀🚀🚀 OrdersExportConsumer BEAN CREATED! 🚀🚀🚀");
    }
    
    @PostConstruct
    public void init() {
        log.error("✅✅✅ OrdersExportConsumer @PostConstruct called! ✅✅✅");
        System.out.println("✅✅✅ OrdersExportConsumer @PostConstruct called! ✅✅✅");
    }
}
```

### Шаг 3: Пересобрать и задеплоить

```bash
# На локальной машине
cd /Users/behruztohtamishov/euroline/autoparts_backend
./mvnw clean package -DskipTests

# Копировать на сервер
scp target/autoparts-0.0.1-SNAPSHOT.jar root@student-vps:~/euroline/autoparts_backend/target/

# На сервере
cd ~/euroline/autoparts_backend
./stop-production.sh
./start-production.sh

# Проверить логи
tail -f /var/log/autoparts.out.log | grep "🚀🚀🚀"
```

### Шаг 4: Проверить результат

**Если логи НЕ появляются**, значит bean не создается. Проверьте:

```bash
# Поиск ошибок при создании bean
grep -i "OrdersExportConsumer" /var/log/autoparts.out.log
grep -i "error" /var/log/autoparts.out.log | grep -i "cml"
grep -i "circular" /var/log/autoparts.out.log
```

## 🚨 Временное решение: Очистить очередь

Пока не решена проблема с consumer, нужно очистить накопившиеся 690 сообщений:

```bash
# Подключиться к RabbitMQ management
# Или через API:
curl -u cml:password -X DELETE http://localhost:15672/api/queues/%2F/orders.export.q/contents

# Или через rabbitmqadmin:
rabbitmqadmin delete queue name=orders.export.q
rabbitmqadmin declare queue name=orders.export.q durable=true arguments='{"x-dead-letter-exchange":"cml.exchange.dlq","x-dead-letter-routing-key":"orders.export.q.dlq"}'
```

## 📊 Диагностика после деплоя

### 1. Проверить создание bean

```bash
grep "🚀🚀🚀 OrdersExportConsumer BEAN CREATED" /var/log/autoparts.out.log
```

Должно быть **РОВНО 1** вхождение при старте приложения.

### 2. Проверить регистрацию RabbitListener

```bash
grep "Registering" /var/log/autoparts.out.log | grep -i rabbit
```

Должно быть что-то вроде:
```
Registering @RabbitListener on OrdersExportConsumer.consume
```

### 3. Проверить получение сообщений

```bash
tail -f /var/log/autoparts.out.log | grep "📥 RECEIVED message"
```

Должны появляться логи при обработке сообщений.

### 4. Проверить RabbitMQ UI

Откройте `http://localhost:15672` (или remote IP) и проверьте:
- **Ready messages** в `orders.export.q` должно уменьшаться
- **Consumer count** должно быть >= 1
- **Message rate** должен показывать активность

## 🔍 Альтернативный подход: Manual purge через код

Если нужно программно очистить очередь, добавьте endpoint в `DiagnosticController`:

```java
@PostMapping("/purge-orders-queue")
public String purgeOrdersQueue() {
    try {
        rabbitAdmin.purgeQueue("orders.export.q", false);
        return "Queue purged successfully";
    } catch (Exception e) {
        return "Error: " + e.getMessage();
    }
}
```

## 📝 Следующие шаги

1. ✅ Убедиться, что OrdersExportConsumer создается (логи `🚀🚀🚀`)
2. ✅ Убедиться, что @RabbitListener регистрируется
3. ✅ Протестировать обработку через `/api/diagnostic/trigger-order-export`
4. ✅ Мониторить очередь - `Ready` должно уменьшаться
5. ✅ Проверить MinIO - файлы должны появляться в `commerce-ml/outbox/orders/`

## 🆘 Если проблема не решается

**Последний вариант: Проверить все consumers:**

```bash
cd /Users/behruztohtamishov/euroline/autoparts_backend
find src/main/java -name "*Consumer.java" -exec grep -l "@RabbitListener" {} \;
```

Проверьте, работают ли **другие** consumers (например, `CatalogImportConsumer`, `OffersImportConsumer`). Если они тоже не работают - проблема в общей конфигурации RabbitMQ.
