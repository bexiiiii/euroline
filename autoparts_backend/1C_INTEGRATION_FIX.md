# 🔧 Исправление интеграции с 1С

## ✅ Что было исправлено в коде

### 1. Проблема с routing файлов offers
**Было:** ZIP файлы всегда направлялись в `CATALOG_IMPORT` очередь, даже если содержали `offers*.xml`

**Исправлено:**
- ✅ Добавлен метод `ZipUtil.hasEntryWithPrefix()` для проверки содержимого ZIP
- ✅ `ImportCoordinator.resolveJobType()` теперь скачивает ZIP и проверяет внутреннее содержимое
- ✅ Файлы `offers0_1.xml` теперь корректно направляются в очередь `OFFERS_IMPORT`
- ✅ `CatalogImportConsumer` выдает понятную ошибку при получении неправильного файла

### 2. Улучшенная логика роутинга
```java
// Теперь ImportCoordinator:
1. Скачивает ZIP файл из S3
2. Проверяет, какой XML внутри (import*.xml или offers*.xml)
3. Направляет в правильную очередь:
   - import*.xml → CATALOG_IMPORT → CatalogImportConsumer
   - offers*.xml → OFFERS_IMPORT → OffersImportConsumer
```

## ⚠️ Настройка 1С (КРИТИЧНО!)

### Текущие учетные данные

Из `application-prod.yml`:
```yaml
cml:
  username: 1c_exchange
  password: 234Euroline456
```

### Правильный URL для 1С

```
URL: https://api.euroline.1edu.kz/api/1c-exchange
Метод авторизации: Basic Auth
Логин: 1c_exchange
Пароль: 234Euroline456
```

### Проверка подключения

Тест соединения:
```bash
curl -u 1c_exchange:234Euroline456 \
  "https://api.euroline.1edu.kz/api/1c-exchange/test"

# Ожидаемый ответ: success
```

Тест авторизации:
```bash
curl -u 1c_exchange:234Euroline456 \
  "https://api.euroline.1edu.kz/api/1c-exchange?type=catalog&mode=checkauth"

# Ожидаемый ответ: success\ncookie_name\ncookie_value
```

## 🔍 Диагностика проблем

### Ошибка: "Авторизация не выполнена"

**Возможные причины:**

1. **Неправильный URL в 1С**
   - ❌ Старый: `https://api.euroline.1edu.kz/api/commerceml`
   - ✅ Новый: `https://api.euroline.1edu.kz/api/1c-exchange`

2. **Неправильный логин/пароль в 1С**
   - ✅ Проверьте: `1c_exchange` / `234Euroline456`

3. **1С не отправляет Basic Auth заголовок**
   - Проверьте настройки аутентификации в 1С

4. **Firewall блокирует запросы**
   - Проверьте логи nginx/backend на наличие входящих запросов

### Проверка логов backend

```bash
# Поиск запросов от 1С
tail -f logs/application.log | grep "1С"

# Проверка аутентификации
tail -f logs/application.log | grep "checkauth"

# Ошибки авторизации
tail -f logs/application.log | grep "Unauthorized\|401"
```

### Ошибка: "Orders export produced null"

**Причина:** В базе данных нет заказов со статусом `NEW`

**Решение:**
```sql
-- Проверить наличие заказов
SELECT id, status, created_at 
FROM cml_orders 
WHERE status = 'NEW' 
ORDER BY created_at DESC 
LIMIT 5;

-- Если заказов нет, создать тестовый
INSERT INTO cml_orders (id, order_id, document_number, status, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM orders ORDER BY id DESC LIMIT 1),
  'TEST-001',
  'NEW',
  NOW()
);
```

## 📋 Чек-лист настройки 1С

- [ ] **URL**: `https://api.euroline.1edu.kz/api/1c-exchange`
- [ ] **Логин**: `1c_exchange`
- [ ] **Пароль**: `234Euroline456`
- [ ] **Метод авторизации**: Basic Authentication
- [ ] **Режим обмена**: Стандартный CommerceML 2.0
- [ ] **Типы обмена**:
  - `catalog` - Выгрузка товаров и предложений
  - `sale` - Загрузка заказов
  - `return` - Загрузка возвратов (опционально)

## 🚀 Следующие шаги

1. **Обновить настройки 1С:**
   - Открыть настройки обмена с сайтом
   - Указать правильный URL
   - Проверить логин/пароль
   - Сохранить изменения

2. **Тестовый обмен:**
   ```
   1. Режим: Проверка связи
   2. Результат должен быть: "Соединение установлено"
   ```

3. **Полный цикл обмена:**
   ```
   1. Выгрузка каталога (import*.xml)
   2. Выгрузка предложений (offers*.xml)
   3. Загрузка заказов (sale:query)
   ```

4. **Мониторинг:**
   - Проверить логи backend: `tail -f logs/application.log`
   - Проверить RabbitMQ: очереди не должны накапливаться
   - Проверить MinIO: файлы должны появляться в `commerce-ml/inbox/`

## 📊 Результат исправлений

После применения всех изменений:

✅ **Проблема 1** - Offers файлы теперь обрабатываются корректно
✅ **Проблема 2** - Orders export работает (если есть заказы в БД)
⏳ **Проблема 3** - Требует настройки URL в 1С

## 🆘 Если проблема не решена

1. **Включить debug логирование:**
   ```yaml
   # application-prod.yml
   logging:
     level:
       autoparts.kz.modules.cml: DEBUG
       org.springframework.security: DEBUG
   ```

2. **Собрать логи:**
   ```bash
   # Последние 500 строк с фильтром по 1С
   tail -500 logs/application.log | grep -A5 -B5 "1С\|checkauth\|cml"
   ```

3. **Проверить Security:**
   - Basic Auth включен для `/api/1c-exchange/**`
   - NoOpPasswordEncoder используется (пароль в открытом виде)
   - Роль `CML` назначается при успешной аутентификации
