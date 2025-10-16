# 🚀 1C CommerceML - Быстрый старт

## ✅ Что было исправлено

1. **Username в конфиге** - убрано лишнее двоеточие
2. **Security конфигурация** - убраны блокирующие фильтры  
3. **SSL redirect** - отключено форсирование HTTPS

---

## 🔑 Данные для подключения

```
URL: https://euroline.1edu.kz/api/1c-exchange
Логин: 1c_exchange
Пароль: 234Euroline456
```

---

## 🧪 Быстрая проверка

### Тест 1: Базовое соединение
```bash
curl -u 1c_exchange:234Euroline456 https://euroline.1edu.kz/api/1c-exchange
```
**Ожидается:** `success`

### Тест 2: Авторизация (как в 1C)
```bash
curl -u 1c_exchange:234Euroline456 \
  "https://euroline.1edu.kz/api/1c-exchange?type=catalog&mode=checkauth"
```
**Ожидается:**
```
success
cookie_name
JSESSIONID
cookie_value
<uuid>
```

### Тест 3: Инициализация
```bash
curl -u 1c_exchange:234Euroline456 \
  "https://euroline.1edu.kz/api/1c-exchange?type=catalog&mode=init"
```
**Ожидается:**
```
zip=yes
file_limit=52428800
```

---

## ⚙️ Настройка в 1C

### Управление торговлей 11

1. **Открыть:** Сервис → Обмен данными → Синхронизация данных
2. **Создать новую настройку:**
   - Тип: CommerceML 2.0
   - Адрес: `https://euroline.1edu.kz`
   - Путь: `/api/1c-exchange`
   - Логин: `1c_exchange`
   - Пароль: `234Euroline456`
   - SSL: Да

3. **Включить обмен:**
   - ✅ Выгружать товары
   - ✅ Выгружать цены  
   - ✅ Выгружать остатки
   - ✅ Загружать заказы

4. **Запустить обмен** → Выполнить выгрузку

---

## 🔧 Деплой изменений

### 1. Собрать проект
```bash
cd /Users/behruztohtamishov/euroline/autoparts_backend
./mvnw clean package -DskipTests
```

### 2. Загрузить на сервер
```bash
scp target/autoparts-backend.jar user@euroline.1edu.kz:/opt/autoparts/
```

### 3. Перезапустить
```bash
ssh user@euroline.1edu.kz
sudo systemctl restart autoparts
sudo systemctl status autoparts
```

### 4. Проверить логи
```bash
sudo journalctl -u autoparts -f | grep -i cml
```

---

## ❗ Решение проблем

### Проблема: "Couldn't resolve host name" в 1C

**На сервере 1C выполните:**
```cmd
nslookup euroline.1edu.kz
ping euroline.1edu.kz
curl https://euroline.1edu.kz
```

Если не работает:
1. Проверьте DNS настройки
2. Проверьте файрвол
3. Проверьте прокси настройки в 1C

### Проблема: HTTP 302 Redirect

✅ **ИСПРАВЛЕНО** в коде - пересоберите и задеплойте

### Проблема: 401 Unauthorized  

Проверьте credentials:
```bash
echo -n "1c_exchange:234Euroline456" | base64
# Должно быть: MWNfZXhjaGFuZ2U6MjM0RXVyb2xpbmU0NTY=
```

---

## 📊 Мониторинг

```bash
# Статус интеграции
curl https://euroline.1edu.kz/api/integration/1c/status

# Логи
ssh user@euroline.1edu.kz
tail -f /var/log/autoparts/application.log | grep CML
```

---

## ✅ Чек-лист

- [x] Исправлен код
- [x] Создана документация
- [ ] Собран проект
- [ ] Задеплоен на сервер
- [ ] Перезапущен сервис
- [ ] Проверены curl тесты
- [ ] Настроен 1C
- [ ] Выполнен первый обмен

---

## 📞 Если не работает

1. Проверьте все curl тесты выше
2. Проверьте логи на сервере
3. Проверьте доступность с сервера 1C
4. Убедитесь что сервис перезапущен после деплоя

**Полная документация:** `COMMERCEML_1C_SETUP.md`
