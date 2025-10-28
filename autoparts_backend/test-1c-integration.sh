#!/bin/bash

# Скрипт для тестирования интеграции с 1С

BASE_URL="https://api.euroline.1edu.kz/api/1c-exchange"
USERNAME="1c_exchange"
PASSWORD="234Euroline456"

echo "🧪 Тестирование интеграции с 1С"
echo "================================"
echo ""

# Тест 1: Проверка соединения
echo "1️⃣ Тест соединения (без авторизации):"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  "${BASE_URL}/test" || echo "❌ FAILED"
echo ""

# Тест 2: Авторизация
echo "2️⃣ Тест авторизации (checkauth):"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -u "${USERNAME}:${PASSWORD}" \
  "${BASE_URL}?type=catalog&mode=checkauth" || echo "❌ FAILED"
echo ""

# Тест 3: Инициализация
echo "3️⃣ Тест инициализации (init):"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -u "${USERNAME}:${PASSWORD}" \
  "${BASE_URL}?type=catalog&mode=init" || echo "❌ FAILED"
echo ""

# Тест 4: Запрос на выгрузку заказов
echo "4️⃣ Тест запроса заказов (sale:query):"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -u "${USERNAME}:${PASSWORD}" \
  "${BASE_URL}?type=sale&mode=query" || echo "❌ FAILED"
echo ""

# Тест 5: Неправильный пароль (должен вернуть 401)
echo "5️⃣ Тест с неправильным паролем (должен быть 401):"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -u "${USERNAME}:wrong_password" \
  "${BASE_URL}?type=catalog&mode=checkauth" || echo "❌ FAILED"
echo ""

echo "================================"
echo "✅ Тестирование завершено"
