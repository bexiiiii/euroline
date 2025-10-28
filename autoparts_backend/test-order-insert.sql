-- Active: 1760214685003@@164.90.180.120@5432@eurolinecloud
-- ============================================
-- Тестовый заказ для проверки CommerceML экспорта
-- ============================================

-- 1. Создаем тестового пользователя (если не существует)
INSERT INTO users (email, password, name, surname, fathername, client_name, phone, country, city, office_address, role, banned, created_at)
VALUES (
    'test.customer@example.com',
    '$2a$10$dummyHashForTesting',  -- bcrypt hash (не важен для теста)
    'Иван',
    'Тестов',
    'Петрович',
    'ТОО "Тестовая Компания"',
    '+77771234567',
    'Казахстан',
    'Алматы',
    'ул. Тестовая 123',
    'USER',
    false,
    NOW()
)
ON CONFLICT (email) DO NOTHING;

-- 2. Создаем тестовый заказ
INSERT INTO orders (
    external_id,
    public_code,
    user_id,
    customer_email,
    delivery_address,
    status,
    payment_status,
    idempotency_key,
    created_at,
    updated_at,
    total_amount,
    version
)
VALUES (
    gen_random_uuid()::text,  -- или можно указать конкретный UUID
    'TEST01',
    (SELECT id FROM users WHERE email = 'test.customer@example.com'),
    'test.customer@example.com',
    'Казахстан, Алматы, ул. Тестовая 123, кв. 45',
    'PENDING',
    'UNPAID',
    'test-order-001',
    NOW(),
    NOW(),
    15000.00,
    0
)
ON CONFLICT (idempotency_key) DO NOTHING
RETURNING id;

-- 3. Создаем позиции заказа (items) - только если их еще нет
WITH order_id AS (
    SELECT id FROM orders WHERE idempotency_key = 'test-order-001'
),
available_products AS (
    SELECT id, code, name FROM products LIMIT 2
),
existing_items AS (
    SELECT COUNT(*) as cnt FROM order_items WHERE order_id = (SELECT id FROM order_id)
)
INSERT INTO order_items (order_id, product_id, quantity, price, sku)
SELECT 
    (SELECT id FROM order_id),
    ap.id,
    2,  -- количество
    5000.00,  -- цена за единицу
    ap.code  -- SKU продукта
FROM available_products ap
WHERE (SELECT cnt FROM existing_items) = 0;  -- Вставляем только если items нет

-- 4. Проверяем созданный заказ
SELECT 
    o.id,
    o.external_id,
    o.public_code,
    o.customer_email,
    o.status,
    o.total_amount,
    o.created_at,
    COUNT(oi.id) as items_count
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.idempotency_key = 'test-order-001'
GROUP BY o.id;

-- 5. Проверяем позиции заказа
SELECT 
    oi.id,
    oi.quantity,
    oi.price,
    p.code as product_code,
    p.name as product_name
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN products p ON oi.product_id = p.id
WHERE o.idempotency_key = 'test-order-001';

-- ============================================
-- 6. Создаем CmlOrder вручную для теста экспорта
-- В реальной системе это делает OrderToCmlConverter
-- ============================================
WITH order_data AS (
    SELECT 
        o.id as order_id,
        o.external_id,
        o.public_code,
        o.customer_email,
        o.delivery_address,
        o.total_amount,
        o.created_at,
        u.client_name,
        u.name,
        u.surname,
        u.phone,
        u.country,
        u.city,
        u.office_address
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.idempotency_key = 'test-order-001'
)
INSERT INTO cml_orders (
    guid,
    number,
    created_at,
    status,
    total,
    customer_guid,
    customer_name,
    customer_client_name,
    customer_email,
    customer_phone,
    customer_country,
    customer_city,
    customer_address
)
SELECT 
    gen_random_uuid()::text,
    public_code,
    created_at,
    'NEW',  -- Статус NEW для экспорта
    total_amount,
    gen_random_uuid()::text,  -- Можно использовать user ID или генерировать GUID
    CONCAT(surname, ' ', name),
    client_name,
    customer_email,
    phone,
    country,
    city,
    COALESCE(delivery_address, office_address)
FROM order_data
ON CONFLICT (number) DO NOTHING
RETURNING id, guid, number, status;

-- 7. Создаем позиции CmlOrder - только если их еще нет
WITH cml_order_id AS (
    SELECT id FROM cml_orders WHERE number = 'TEST01'
),
order_products AS (
    SELECT 
        oi.quantity,
        oi.price,
        p.code,
        p.name
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN products p ON oi.product_id = p.id
    WHERE o.idempotency_key = 'test-order-001'
),
existing_cml_items AS (
    SELECT COUNT(*) as cnt FROM cml_order_items WHERE order_id = (SELECT id FROM cml_order_id)
)
INSERT INTO cml_order_items (
    order_id,
    product_guid,
    article,
    product_name,
    qty,
    price,
    sum
)
SELECT 
    (SELECT id FROM cml_order_id),
    gen_random_uuid()::text,  -- В реальности берется из cml_products
    op.code,
    op.name,
    op.quantity,
    op.price,
    op.price * op.quantity  -- sum = price * qty
FROM order_products op
WHERE (SELECT cnt FROM existing_cml_items) = 0;  -- Вставляем только если items нет

-- 8. Проверяем созданный CmlOrder
SELECT 
    co.id,
    co.guid,
    co.number,
    co.status,
    co.total,
    co.customer_name,
    co.customer_email,
    co.created_at,
    COUNT(coi.id) as items_count
FROM cml_orders co
LEFT JOIN cml_order_items coi ON co.id = coi.order_id
WHERE co.number = 'TEST01'
GROUP BY co.id;

-- 9. Проверяем позиции CmlOrder
SELECT 
    coi.id,
    coi.article,
    coi.product_name,
    coi.qty,
    coi.price,
    coi.sum
FROM cml_order_items coi
JOIN cml_orders co ON coi.order_id = co.id
WHERE co.number = 'TEST01';

-- ============================================
-- ГОТОВО! Теперь можно:
-- 1. Вызвать OrdersExportService.exportOrders()
-- 2. Или подождать 5 минут пока OrdersExportScheduler сработает
-- 3. Проверить MinIO: commerce-ml/outbox/orders/
-- ============================================
SELECT * FROM cml_order_items WHERE order_id = (SELECT id FROM cml_orders WHERE number = 'TEST01');