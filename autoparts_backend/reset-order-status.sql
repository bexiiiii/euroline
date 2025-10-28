-- SQL скрипт для сброса статуса заказа на NEW (для повторного тестирования)

-- Вариант 1: Сбросить статус конкретного заказа
UPDATE cml_orders 
SET status = 'NEW'
WHERE id = 1;

-- Вариант 2: Сбросить статус всех CONFIRMED заказов (ОСТОРОЖНО!)
-- UPDATE cml_orders 
-- SET status = 'NEW'
-- WHERE status = 'CONFIRMED';

-- Проверка результата
SELECT 
    id,
    guid,
    number,
    status,
    total,
    customer_name,
    created_at
FROM cml_orders 
WHERE status = 'NEW'
ORDER BY created_at DESC;
