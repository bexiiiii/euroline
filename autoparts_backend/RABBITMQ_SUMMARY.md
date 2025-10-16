# 🎯 Summary: RabbitMQ Consumer Debug - OrdersExportConsumer

## 📊 Текущая ситуация

### Проблема
- **690 сообщений** застряли в очереди `orders.export.q`
- **1 сообщение** в Dead Letter Queue (DLQ)
- **OrdersExportConsumer НЕ обрабатывает** сообщения
- В логах **НЕТ** строки инициализации consumer

### Диагностика показала
1. ✅ Сообщения **успешно публикуются** в RabbitMQ
2. ✅ Очереди **правильно настроены** и созданы
3. ✅ Bindings **корректны** (exchange → routing key → queue)
4. ❌ **OrdersExportConsumer bean не создается** или создается с ошибкой
5. ❌ **@RabbitListener не регистрируется**

## 🔧 Внесенные изменения

### 1. OrdersExportConsumer.java
Добавлено **агрессивное логирование**:

```java
public OrdersExportConsumer(...) {
    // Тройное логирование для гарантии видимости
    log.error("🚀🚀🚀 OrdersExportConsumer BEAN CREATED! 🚀🚀🚀");
    System.out.println("🚀🚀🚀 OrdersExportConsumer BEAN CREATED! 🚀🚀🚀");
    System.err.println("🚀🚀🚀 OrdersExportConsumer BEAN CREATED! 🚀🚀🚀");
}

@PostConstruct
public void init() {
    log.error("✅✅✅ OrdersExportConsumer @PostConstruct called! ✅✅✅");
    System.out.println("✅✅✅ OrdersExportConsumer @PostConstruct called! ✅✅✅");
    System.err.println("✅✅✅ OrdersExportConsumer @PostConstruct called! ✅✅✅");
}

@RabbitListener(queues = "orders.export.q", ...)
public void consume(ExchangeJob job) {
    log.error("📥📥📥 RECEIVED MESSAGE! RequestId: {}, Filename: {} 📥📥📥", ...);
    System.out.println("📥📥📥 RECEIVED: " + job.requestId());
    System.err.println("📥📥📥 RECEIVED: " + job.requestId());
    // ...
}
```

**Цель:** Сделать видимым ЛЮБОЙ lifecycle event consumer-а

### 2. JobQueue.java
Добавлено детальное логирование публикации:

```java
public void submit(JobType jobType, ExchangeJob job) {
    log.info("📤 Publishing job {} for file {} key {}", ...);
    log.info("📤 Exchange: {}, RoutingKey: {}, RequestId: {}", ...);
    try {
        rabbitTemplate.convertAndSend(...);
        log.info("📤 Message sent successfully to exchange '{}' with routing key '{}'", ...);
    } catch (Exception e) {
        log.error("❌ Failed to publish job to RabbitMQ", e);
        throw e;
    }
}
```

### 3. application.yml
Добавлен DEBUG уровень для RabbitMQ:

```yaml
logging:
  level:
    autoparts.kz.modules.cml: DEBUG
    org.springframework.amqp: DEBUG
    org.springframework.amqp.rabbit: DEBUG
```

### 4. DiagnosticController.java (новый)
Добавлен endpoint для ручного тестирования:

```java
@PostMapping("/api/diagnostic/trigger-order-export")
public String triggerOrderExport() {
    // Manually triggers order export job
    // Returns requestId for tracking
}
```

## 📋 План действий

### Немедленные действия (сейчас)

1. **Пересобрать проект:**
   ```bash
   cd /Users/behruztohtamishov/euroline/autoparts_backend
   ./mvnw clean package -DskipTests
   ```

2. **Задеплоить на сервер:**
   ```bash
   scp target/autoparts-0.0.1-SNAPSHOT.jar root@student-vps:~/euroline/autoparts_backend/target/
   ssh root@student-vps "cd ~/euroline/autoparts_backend && ./stop-production.sh && ./start-production.sh"
   ```

3. **Проверить логи:**
   ```bash
   ssh root@student-vps "tail -100 /var/log/autoparts.out.log | grep '🚀🚀🚀'"
   ```

### Ожидаемый результат

**При успешном старте должны появиться:**

```
🚀🚀🚀 OrdersExportConsumer BEAN CREATED! 🚀🚀🚀
✅✅✅ OrdersExportConsumer @PostConstruct called! ✅✅✅
📥📥📥 RECEIVED MESSAGE! RequestId: xxx, Filename: orders.xml 📥📥📥
🔄 Processing orders export job: xxx
✅ Orders export produced commerce-ml/outbox/orders/orders-xxx.xml
```

**RabbitMQ UI должно показать:**
- `orders.export.q` Ready: уменьшается с 690
- `orders.export.q` Consumers: >= 1 (не 0!)
- Message rate: активность

### Если проблема НЕ решится

**Возможные причины:**

1. **Circular dependency** - Spring не может создать bean
   ```bash
   grep -i "circular" /var/log/autoparts.out.log
   ```

2. **Missing dependency** - какой-то bean не найден
   ```bash
   grep -i "could not autowire" /var/log/autoparts.out.log
   grep -i "no qualifying bean" /var/log/autoparts.out.log
   ```

3. **Exception в constructor** - тихая ошибка при создании
   ```bash
   grep -A 20 "OrdersExportConsumer" /var/log/autoparts.out.log | grep -i error
   ```

4. **Component scan issue** - класс не сканируется
   Проверить: package должен быть `autoparts.kz.modules.cml.queue.consumers`

## 📊 Метрики для мониторинга

После деплоя следить за:

1. **RabbitMQ Queue Size:**
   - `orders.export.q` Ready должно падать: 690 → 0
   - Скорость: ~10-20 сообщений/сек (зависит от prefetch и consumers)

2. **Application Logs:**
   - Частота появления `📥📥📥 RECEIVED MESSAGE`
   - Отсутствие `❌ Orders export job failed`

3. **MinIO Storage:**
   - Файлы появляются в `commerce-ml/outbox/orders/`
   - Формат: `orders-{timestamp}.xml`

4. **System Resources:**
   - CPU usage (может вырасти при обработке 690 сообщений)
   - Memory usage
   - Network I/O (S3 uploads)

## 🎯 Success Criteria

✅ В логах есть `🚀🚀🚀 OrdersExportConsumer BEAN CREATED!`  
✅ В логах есть `✅✅✅ OrdersExportConsumer @PostConstruct called!`  
✅ В логах регулярно появляются `📥📥📥 RECEIVED MESSAGE!`  
✅ RabbitMQ UI показывает Consumers >= 1  
✅ RabbitMQ Queue Ready уменьшается  
✅ Файлы появляются в MinIO  

## 📝 Документация

Созданные файлы:
- `RABBITMQ_CONSUMER_FIX.md` - детальный анализ проблемы
- `DEPLOY_INSTRUCTIONS.md` - пошаговая инструкция для деплоя
- `RABBITMQ_SUMMARY.md` - этот файл

## 🔗 Next Steps

После успешного деплоя:
1. Мониторить обработку 690 сообщений (~5-10 минут)
2. Проверить файлы в MinIO
3. Протестировать с новыми заказами
4. Настроить алерты на размер очереди (threshold: 100 сообщений)
5. Рассмотреть добавление метрик в Prometheus/Grafana

---

**Дата:** 2025-10-16  
**Статус:** Ожидает деплоя и проверки  
**Приоритет:** 🔴 CRITICAL  
