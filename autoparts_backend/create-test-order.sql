-- SQL скрипт для создания тестового заказа в статусе NEW

-- Создаем новый тестовый заказ
INSERT INTO cml_orders (
    guid,
    number,
    created_at,
    status,
    total,
    customer_guid,
    customer_name,
    customer_email,
    customer_phone,
    customer_country,
    customer_city,
    customer_address,
    customer_client_name
) VALUES (
    gen_random_uuid(),
    'TEST-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS'),
    NOW(),
    'NEW',  -- ✅ Статус NEW для экспорта в 1С
    25000.00,
    gen_random_uuid(),
    'Петров Сергей Александрович',
    'petrov.sergey@example.com',
    '+77012345678',
    'Казахстан',
    'Астана',
    'Казахстан, Астана, пр. Кабанбай батыра 53, офис 201',
    'ТОО "Автозапчасти Плюс"'
);

-- Проверяем, что заказ создан
SELECT 
    id,
    guid,
    number,
    status,
    total,
    customer_name,
    customer_phone,
    customer_city,
    created_at
FROM cml_orders 
WHERE status = 'NEW'
ORDER BY created_at DESC 
LIMIT 5;
