#!/bin/bash

# 🧪 Комплексный тест всех исправлений

echo "🔍 ТЕСТИРОВАНИЕ ИСПРАВЛЕНИЙ ИНТЕГРАЦИИ С 1С"
echo "============================================"
echo ""

BASE_URL="https://api.euroline.1edu.kz/api/1c-exchange"
USERNAME="1c_exchange"
PASSWORD="234Euroline456"

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📍 Тестируемый сервер: $BASE_URL"
echo ""

# Тест 1: Авторизация
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  ТЕСТ АВТОРИЗАЦИИ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
RESPONSE=$(curl -s -w "\n%{http_code}" -u "${USERNAME}:${PASSWORD}" \
  "${BASE_URL}?type=catalog&mode=checkauth")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ] && [[ "$BODY" == *"success"* ]]; then
    echo -e "${GREEN}✅ PASSED${NC} - Авторизация успешна"
    echo "   Response: $BODY"
else
    echo -e "${RED}❌ FAILED${NC} - HTTP $HTTP_CODE"
    echo "   Response: $BODY"
    exit 1
fi
echo ""

# Тест 2: Инициализация
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  ТЕСТ ИНИЦИАЛИЗАЦИИ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
RESPONSE=$(curl -s -w "\n%{http_code}" -u "${USERNAME}:${PASSWORD}" \
  "${BASE_URL}?type=catalog&mode=init")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ] && [[ "$BODY" == *"zip=yes"* ]]; then
    echo -e "${GREEN}✅ PASSED${NC} - Инициализация успешна"
    echo "   Response: $BODY"
else
    echo -e "${RED}❌ FAILED${NC} - HTTP $HTTP_CODE"
    echo "   Response: $BODY"
fi
echo ""

# Тест 3: Запрос заказов
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  ТЕСТ ЭКСПОРТА ЗАКАЗОВ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
RESPONSE=$(curl -s -w "\n%{http_code}" -u "${USERNAME}:${PASSWORD}" \
  "${BASE_URL}?type=sale&mode=query")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    if [[ "$BODY" == *"<?xml"* ]] || [[ "$BODY" == *"<КоммерческаяИнформация"* ]]; then
        echo -e "${GREEN}✅ PASSED${NC} - Заказы найдены и экспортированы"
        echo "   Первые 200 символов XML:"
        echo "   $(echo "$BODY" | head -c 200)..."
    elif [[ "$BODY" == *"failure"* ]] && [[ "$BODY" == *"No orders"* ]]; then
        echo -e "${YELLOW}⚠️  WARNING${NC} - Нет NEW заказов для экспорта"
        echo "   Response: $BODY"
        echo ""
        echo "   💡 Решение: Выполните SQL запрос:"
        echo "      UPDATE cml_orders SET status = 'NEW' WHERE id = 1;"
    else
        echo -e "${YELLOW}⚠️  WARNING${NC} - Неожиданный ответ"
        echo "   Response: $BODY"
    fi
else
    echo -e "${RED}❌ FAILED${NC} - HTTP $HTTP_CODE"
    echo "   Response: $BODY"
fi
echo ""

# Тест 4: Проверка без авторизации (должен быть 401)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  ТЕСТ БЕЗОПАСНОСТИ (без авторизации)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  "${BASE_URL}?type=catalog&mode=checkauth")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - Неавторизованный доступ заблокирован (401)"
else
    echo -e "${RED}❌ FAILED${NC} - HTTP $HTTP_CODE (ожидался 401)"
    echo "   ⚠️  Эндпоинт доступен без авторизации - угроза безопасности!"
fi
echo ""

# Итоги
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 ИТОГИ ТЕСТИРОВАНИЯ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Следующие шаги:"
echo "1. ✅ Если все тесты прошли - настройте 1С с этими credentials"
echo "2. ⚠️  Если тест #3 показал WARNING - создайте NEW заказ в БД"
echo "3. 🔄 Запустите полный обмен в 1С и проверьте логи backend"
echo ""
