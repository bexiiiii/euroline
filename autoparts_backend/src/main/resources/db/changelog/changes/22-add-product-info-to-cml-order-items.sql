-- liquibase formatted sql

-- changeset system:22-add-product-info-to-cml-order-items
-- Добавление полей product_name и article в cml_order_items для генерации полного XML для 1С

ALTER TABLE cml_order_items
    ADD COLUMN IF NOT EXISTS product_name VARCHAR(500),
    ADD COLUMN IF NOT EXISTS article VARCHAR(100);

COMMENT ON COLUMN cml_order_items.product_name IS 'Наименование товара для экспорта в 1С';
COMMENT ON COLUMN cml_order_items.article IS 'Артикул товара для экспорта в 1С';

-- Заполнить существующие данные из таблицы products (если есть связь по product_guid)
UPDATE cml_order_items coi
SET 
    product_name = p.name,
    article = p.article
FROM products p
WHERE coi.product_guid = p.external_code
  AND (coi.product_name IS NULL OR coi.article IS NULL);
