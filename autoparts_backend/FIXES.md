# Исправление критических ошибок сервера

## Дата: 2025-10-14

### Проблемы, которые были исправлены:

#### 1. ⚠️ HikariCP Connection Pool - "Failed to validate connection"

**Проблема:**
```
HikariPool-1 - Failed to validate connection org.postgresql.jdbc.PgConnection@xxx 
(This connection has been closed.). Possibly consider using a shorter maxLifetime value.
```

**Причина:**
- `max-lifetime` был установлен на 1200000ms (20 минут) в `application.yml`
- `max-lifetime` был установлен на 900000ms (15 минут) в `application-prod.yml`
- PostgreSQL по умолчанию закрывает неактивные соединения через 10 минут
- HikariCP пытался использовать уже закрытые соединения

**Решение:**
```yaml
hikari:
  max-lifetime: 540000  # 9 минут (меньше чем PostgreSQL wait_timeout)
  keepalive-time: 300000  # 5 минут keepalive для поддержания соединений
```

#### 2. ⚠️ RabbitMQ Connection - "Heartbeat missing"

**Проблема:**
```
com.rabbitmq.client.MissedHeartbeatException: Heartbeat missing with heartbeat = 60 seconds
```

**Причина:**
- Не была настроена конфигурация heartbeat для RabbitMQ
- Соединение разрывалось из-за отсутствия keepalive пакетов
- RabbitMQ ожидал heartbeat каждые 60 секунд, но не получал их

**Решение:**
```yaml
rabbitmq:
  connection-timeout: 30000
  requested-heartbeat: 30  # Heartbeat каждые 30 секунд
  listener:
    simple:
      retry:
        enabled: true
        initial-interval: 2000
        max-attempts: 3
        max-interval: 10000
        multiplier: 2
```

#### 3. ⚠️ 1C Integration Error Logging - "Connection refused"

**Проблема:**
```
ERROR - Failed to connect to 1C: I/O error on GET request for 
"http://localhost:8081/api/1c/ping": Connection refused
```

**Причина:**
- Ошибка логировалась как ERROR, хотя это ожидаемое поведение когда 1C не запущен
- Захламляла логи ненужными ERROR сообщениями

**Решение:**
- Изменен уровень логирования с `ERROR` на `DEBUG` в `OneCIntegrationServiceImpl.java`
- Добавлено пояснение, что это ожидаемое поведение

```java
logger.debug("Failed to connect to 1C (this is expected if 1C is not running): {}", e.getMessage());
```

### Файлы, которые были изменены:

1. ✅ `src/main/resources/application.yml`
   - HikariCP настройки
   - RabbitMQ настройки с heartbeat

2. ✅ `src/main/resources/application-prod.yml`
   - HikariCP настройки для production
   - RabbitMQ настройки с heartbeat для production

3. ✅ `src/main/java/autoparts/kz/modules/stockOneC/service/impl/OneCIntegrationServiceImpl.java`
   - Уровень логирования ошибок подключения к 1C

### Как проверить исправления:

1. **Проверка HikariCP:**
```bash
# Мониторинг логов - не должно быть "Failed to validate connection"
tail -f logs/application.log | grep "HikariPool"
```

2. **Проверка RabbitMQ:**
```bash
# Проверка активных соединений в RabbitMQ
docker exec rabbitmq-autoparts rabbitmqctl list_connections

# Логи не должны содержать "MissedHeartbeatException"
tail -f logs/application.log | grep "Heartbeat"
```

3. **Проверка 1C Integration:**
```bash
# DEBUG логи вместо ERROR (только если уровень DEBUG включен)
tail -f logs/application.log | grep "1C"
```

### Рекомендации для production:

1. **PostgreSQL:** Убедитесь, что параметр `idle_in_transaction_session_timeout` в PostgreSQL установлен правильно
2. **RabbitMQ:** Мониторьте очереди через веб-интерфейс: http://localhost:15672
3. **Мониторинг:** Настройте алерты на метрики HikariCP и RabbitMQ через Actuator/Prometheus

### Дополнительная настройка (опционально):

Если проблемы продолжаются, можно дополнительно настроить:

```yaml
# PostgreSQL параметры
spring:
  datasource:
    hikari:
      connection-test-query: SELECT 1  # Принудительная проверка соединения
```

```yaml
# RabbitMQ дополнительные параметры
spring:
  rabbitmq:
    publisher-confirm-type: correlated
    publisher-returns: true
```
