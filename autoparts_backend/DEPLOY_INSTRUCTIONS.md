# 🚀 Инструкция по деплою и проверке RabbitMQ Consumer

## 1️⃣ Пересобрать проект (на вашем Mac)

```bash
cd /Users/behruztohtamishov/euroline/autoparts_backend
./mvnw clean package -DskipTests
```

## 2️⃣ Скопировать на сервер

```bash
scp target/autoparts-0.0.1-SNAPSHOT.jar root@student-vps:~/euroline/autoparts_backend/target/
```

## 3️⃣ Перезапустить приложение на сервере

```bash
ssh root@student-vps
cd ~/euroline/autoparts_backend
./stop-production.sh
./start-production.sh
```

## 4️⃣ Проверить логи - СРАЗУ после старта

```bash
# Ищем ЭТИ строки - они ОБЯЗАТЕЛЬНО должны появиться:
tail -100 /var/log/autoparts.out.log | grep "🚀🚀🚀"
# Должно быть: 🚀🚀🚀 OrdersExportConsumer BEAN CREATED! 🚀🚀🚀

tail -100 /var/log/autoparts.out.log | grep "✅✅✅"
# Должно быть: ✅✅✅ OrdersExportConsumer @PostConstruct called! ✅✅✅
```

## 5️⃣ Проверить обработку сообщений

```bash
# Следить за обработкой в реальном времени:
tail -f /var/log/autoparts.out.log | grep -E "📥|🔄|✅|❌"
```

Должны появляться строки типа:
```
📥📥📥 RECEIVED MESSAGE! RequestId: xxx, Filename: orders.xml 📥📥📥
🔄 Processing orders export job: xxx
✅ Orders export produced commerce-ml/outbox/orders/...
```

## 6️⃣ Проверить RabbitMQ UI

Откройте http://YOUR_SERVER_IP:15672

**Проверьте очередь `orders.export.q`:**
- **Ready**: должно УМЕНЬШАТЬСЯ (было 690)
- **Consumers**: должно быть >= 1 (не 0!)
- **Message rate**: должен показывать активность

## 🆘 Если НЕТ логов `🚀🚀🚀`

**Это значит, что OrdersExportConsumer НЕ создается!**

Проверьте ошибки:
```bash
grep -i "error.*OrdersExportConsumer" /var/log/autoparts.out.log
grep -i "error.*OrdersExportService" /var/log/autoparts.out.log
grep -i "circular" /var/log/autoparts.out.log
```

## ✅ Успешный результат

Через несколько минут:
1. ✅ В логах есть `🚀🚀🚀 OrdersExportConsumer BEAN CREATED!`
2. ✅ В логах есть `✅✅✅ OrdersExportConsumer @PostConstruct called!`
3. ✅ В логах появляются `📥📥📥 RECEIVED MESSAGE!`
4. ✅ В RabbitMQ UI: `orders.export.q` Ready уменьшается с 690 до 0
5. ✅ В RabbitMQ UI: Consumers = 1 или больше
6. ✅ В MinIO появляются файлы в `commerce-ml/outbox/orders/`

## 📞 Что дальше

После успешного деплоя пришлите логи:
```bash
tail -200 /var/log/autoparts.out.log | grep -E "🚀|✅|📥"
```

Я проверю, что всё работает правильно!
