# Интеграция возвратов товаров с 1C через CommerceML

## 🎯 Описание функционала

Реализован полный цикл возврата товаров с интеграцией в 1C:

```
┌─────────────┐      ┌──────────────┐      ┌─────────┐      ┌────────┐
│   Клиент    │─────▶│   Админка    │─────▶│  Backend│─────▶│   1C   │
│  (Заявка)   │      │ (Одобрение)  │      │  (XML)  │      │(Возврат)│
└─────────────┘      └──────────────┘      └─────────┘      └────────┘
```

---

## 📋 Workflow возврата товара

### 1. Клиент создает заявку на возврат (через сайт)

**Endpoint:** `POST /api/finance/refund-requests`

```json
{
  "clientId": 123,
  "orderId": 456,
  "amount": 15000.00,
  "reason": "Товар не подошел"
}
```

**Результат:**
- Создается запись в таблице `refund_requests` со статусом `NEW`
- Заявка появляется в админке

### 2. Админ рассматривает заявку в админке

**Страница:** `/admin/finance/refund-requests`

Админ может:
- Просмотреть детали заявки
- Изменить статус на:
  - `IN_REVIEW` - На рассмотрении
  - `APPROVED` - Одобрено
  - `REJECTED` - Отклонено

### 3. При одобрении автоматически отправляется в 1C

**Endpoint (внутренний):** `FinanceService.patchRefund()`

При изменении статуса на `APPROVED`:

1. ✅ Начисляется возврат на баланс клиента
2. ✅ Отправляется уведомление клиенту
3. ✅ **Автоматически вызывается отправка в 1C:**
   ```java
   returnIntegrationService.sendReturnTo1C(refundId);
   ```

**Что происходит при отправке:**
- Генерируется XML документ возврата в формате CommerceML 2.0
- XML сохраняется в S3 (bucket: `commerce-ml`)
- Возврат помечается как отправленный (`sent_to_1c = true`)

### 4. 1C забирает возвраты

**Endpoint для 1C:** `GET /api/1c-exchange?type=return&mode=query`

**Авторизация:** Basic Auth (логин: `1c_exchange`, пароль: `234Euroline456`)

**Ответ:** XML с пакетом всех одобренных возвратов

```xml
<?xml version="1.0" encoding="UTF-8"?>
<КоммерческаяИнформация ВерсияСхемы="2.05" ДатаФормирования="2025-10-16T14:00:00">
  <Документ>
    <Ид>RETURN-123-uuid</Ид>
    <Номер>RET-123</Номер>
    <Дата>2025-10-16</Дата>
    <ХозОперация>Возврат товара</ХозОперация>
    <Роль>Покупатель</Роль>
    <Валюта>KZT</Валюта>
    <Сумма>15000.00</Сумма>
    
    <!-- Связь с оригинальным заказом -->
    <ОснованиеДокумента>
      <Ид>order-external-id</Ид>
      <Номер>456</Номер>
      <Дата>2025-10-10</Дата>
    </ОснованиеДокумента>
    
    <!-- Контрагент -->
    <Контрагенты>
      <Контрагент>
        <Ид>CLIENT-123</Ид>
        <Наименование>Иванов Иван Иванович</Наименование>
        <Роль>Покупатель</Роль>
        <Контакты>
          <Контакт>
            <Тип>Телефон</Тип>
            <Значение>+7 777 123 4567</Значение>
          </Контакт>
          <Контакт>
            <Тип>Почта</Тип>
            <Значение>client@example.com</Значение>
          </Контакт>
        </Контакты>
      </Контрагент>
    </Контрагенты>
    
    <!-- Товары для возврата -->
    <Товары>
      <Товар>
        <Ид>PROD-789</Ид>
        <Наименование>Тормозные колодки</Наименование>
        <Артикул>TK-001</Артикул>
        <БазоваяЕдиница>шт</БазоваяЕдиница>
        <Количество>2</Количество>
        <ЦенаЗаЕдиницу>7500.00</ЦенаЗаЕдиницу>
        <Сумма>15000.00</Сумма>
      </Товар>
    </Товары>
    
    <!-- Реквизиты -->
    <ЗначенияРеквизитов>
      <ЗначениеРеквизита>
        <Наименование>Статус возврата</Наименование>
        <Значение>APPROVED</Значение>
      </ЗначениеРеквизита>
      <ЗначениеРеквизита>
        <Наименование>Комментарий администратора</Наименование>
        <Значение>Возврат одобрен</Значение>
      </ЗначениеРеквизита>
      <ЗначениеРеквизита>
        <Наименование>Тип возврата</Наименование>
        <Значение>Возврат через сайт</Значение>
      </ЗначениеРеквизита>
    </ЗначенияРеквизитов>
  </Документ>
</КоммерческаяИнформация>
```

### 5. 1C подтверждает получение

**Endpoint:** `GET /api/1c-exchange?type=return&mode=success`

---

## 🔧 REST API для управления возвратами (Админка)

### Отправить конкретный возврат в 1C вручную

```bash
POST /api/integration/1c/returns/{id}/send
Authorization: Bearer <admin-token>
```

**Ответ:**
```json
{
  "success": true,
  "message": "Возврат успешно отправлен в 1C",
  "refundId": 123
}
```

### Отправить все ожидающие возвраты

```bash
POST /api/integration/1c/returns/send-pending
Authorization: Bearer <admin-token>
```

**Ответ:**
```json
{
  "success": true,
  "message": "Обработано возвратов: 5",
  "count": 5
}
```

### Предпросмотр XML пакета возвратов

```bash
GET /api/integration/1c/returns/preview-xml
Authorization: Bearer <admin-token>
```

**Ответ:** XML документ со всеми ожидающими возвратами

---

## 🗄️ Структура БД

### Новые поля в таблице `refund_requests`

```sql
ALTER TABLE refund_requests ADD COLUMN:
- sent_to_1c BOOLEAN DEFAULT FALSE        -- Флаг отправки в 1C
- sent_to_1c_at TIMESTAMP                 -- Дата отправки
- external_id VARCHAR(255)                -- ID документа в 1C

CREATE INDEX idx_refund_requests_sent_to_1c ON refund_requests(sent_to_1c);
CREATE INDEX idx_refund_requests_external_id ON refund_requests(external_id);
```

---

## 📝 Настройка в 1C

### Добавить обработку возвратов

В 1C нужно настроить:

1. **Новый тип обмена:** `return`
2. **Endpoint:** `https://euroline.1edu.kz/api/1c-exchange?type=return&mode=query`
3. **Периодичность:** каждые 15 минут (или по требованию)

### Обработка возвратов в 1C

1. **Получение возвратов:**
   - 1C делает GET запрос к `/api/1c-exchange?type=return&mode=query`
   - Получает XML со списком возвратов

2. **Создание документов:**
   - На основе XML создаются документы "Возврат товара от покупателя"
   - Связываются с оригинальными заказами через `ОснованиеДокумента`

3. **Обработка:**
   - Возврат товара на склад
   - Оформление возврата денег
   - Изменение статуса заказа

4. **Подтверждение:**
   - 1C вызывает `/api/1c-exchange?type=return&mode=success`

---

## 🧪 Тестирование

### 1. Тест генерации XML

```bash
curl -H "Authorization: Bearer <admin-token>" \
  https://euroline.1edu.kz/api/integration/1c/returns/preview-xml
```

### 2. Тест получения возвратов (как 1C)

```bash
curl -u 1c_exchange:234Euroline456 \
  "https://euroline.1edu.kz/api/1c-exchange?type=return&mode=query"
```

### 3. Тест подтверждения

```bash
curl -u 1c_exchange:234Euroline456 \
  "https://euroline.1edu.kz/api/1c-exchange?type=return&mode=success"
```

### 4. Полный цикл тестирования

```bash
# 1. Создать заявку на возврат
curl -X POST https://euroline.1edu.kz/api/finance/refund-requests \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": 1,
    "orderId": 1,
    "amount": 1000,
    "reason": "Тест"
  }'

# 2. Одобрить возврат (админка)
curl -X PATCH https://euroline.1edu.kz/api/finance/refund-requests/1 \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "APPROVED"}'

# 3. Проверить, что возврат появился для 1C
curl -u 1c_exchange:234Euroline456 \
  "https://euroline.1edu.kz/api/1c-exchange?type=return&mode=query"
```

---

## 📊 Мониторинг

### Логи

```bash
# Все операции с возвратами
tail -f /var/log/autoparts/application.log | grep -i "return"

# Отправка в 1C
tail -f /var/log/autoparts/application.log | grep "ReturnIntegrationService"

# CommerceML exchange
tail -f /var/log/autoparts/application.log | grep "1c-exchange.*return"
```

### SQL запросы для проверки

```sql
-- Возвраты, ожидающие отправки в 1C
SELECT * FROM refund_requests 
WHERE status = 'APPROVED' AND (sent_to_1c IS NULL OR sent_to_1c = FALSE);

-- Возвраты, отправленные в 1C
SELECT * FROM refund_requests 
WHERE sent_to_1c = TRUE 
ORDER BY sent_to_1c_at DESC 
LIMIT 10;

-- Статистика возвратов
SELECT 
  status,
  COUNT(*) as count,
  SUM(amount) as total_amount,
  COUNT(CASE WHEN sent_to_1c = TRUE THEN 1 END) as sent_to_1c_count
FROM refund_requests
GROUP BY status;
```

---

## ✅ Чеклист развертывания

- [x] Создан `ReturnDocumentXmlGenerator` для генерации XML
- [x] Создан `ReturnIntegrationService` для управления возвратами
- [x] Добавлены endpoints в `OneCExchangeController`
- [x] Создан `ReturnIntegrationController` для админки
- [x] Интегрирована автоматическая отправка в `FinanceService`
- [x] Добавлена миграция БД для новых полей
- [ ] Пересобрать приложение
- [ ] Запустить миграцию БД
- [ ] Задеплоить на сервер
- [ ] Настроить обмен в 1C
- [ ] Протестировать полный цикл

---

## 🚀 Запуск

### 1. Пересборка

```bash
cd /Users/behruztohtamishov/euroline/autoparts_backend
./mvnw clean package -DskipTests
```

### 2. Деплой на сервер

```bash
scp target/autoparts-*.jar user@euroline.1edu.kz:~/
ssh user@euroline.1edu.kz
sudo systemctl restart autoparts
```

### 3. Проверка логов

```bash
sudo journalctl -u autoparts -f
```

---

## 📞 Поддержка

При возникновении проблем проверьте:

1. **Логи приложения** - `/var/log/autoparts/application.log`
2. **Статус возвратов в БД** - SQL запросы выше
3. **Доступность S3** - проверьте bucket `commerce-ml`
4. **Настройки 1C** - проверьте endpoint и авторизацию

**Интеграция возвратов готова! 🎉**
