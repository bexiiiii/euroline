#!/bin/bash

# Скрипт для запуска RabbitMQ для интеграции с 1C

echo "Запуск RabbitMQ для интеграции autoparts с 1C..."

# Останавливаем контейнер если он уже запущен
docker stop rabbitmq-autoparts 2>/dev/null || true
docker rm rabbitmq-autoparts 2>/dev/null || true

# Запускаем новый контейнер RabbitMQ
docker run -d \
  --name rabbitmq-autoparts \
  -p 5672:5672 \
  -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=cml \
  -e RABBITMQ_DEFAULT_PASS=cml \
  -e RABBITMQ_DEFAULT_VHOST=/ \
  rabbitmq:3.13-management

echo "RabbitMQ запущен!"
echo ""
echo "Подключение:"
echo "  URL: amqp://localhost:5672"
echo "  Пользователь: cml"
echo "  Пароль: cml"
echo ""
echo "Веб-интерфейс:"
echo "  URL: http://localhost:15672"
echo "  Пользователь: cml"
echo "  Пароль: cml"
echo ""
echo "Ожидание запуска RabbitMQ..."

# Ждем пока RabbitMQ полностью запустится
sleep 10

echo "RabbitMQ готов к работе!"
echo ""
echo "Для просмотра логов используйте:"
echo "  docker logs -f rabbitmq-autoparts"
echo ""
echo "Для остановки используйте:"
echo "  docker stop rabbitmq-autoparts"