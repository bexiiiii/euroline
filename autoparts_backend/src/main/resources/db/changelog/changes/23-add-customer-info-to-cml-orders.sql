-- Active: 1760214685003@@164.90.180.120@5432@eurolinecloud

-- liquibase formatted sql

-- changeset system:23-add-customer-info-to-cml-orders
-- Добавление полей с информацией о клиенте в cml_orders для полного экспорта в 1С

ALTER TABLE cml_orders
    ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS customer_client_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50),
    ADD COLUMN IF NOT EXISTS customer_country VARCHAR(100),
    ADD COLUMN IF NOT EXISTS customer_city VARCHAR(100),
    ADD COLUMN IF NOT EXISTS customer_address VARCHAR(500);

COMMENT ON COLUMN cml_orders.customer_name IS 'ФИО клиента для экспорта в 1С';
COMMENT ON COLUMN cml_orders.customer_client_name IS 'Название заведения/компании клиента для экспорта в 1С';
COMMENT ON COLUMN cml_orders.customer_email IS 'Email клиента для экспорта в 1С';
COMMENT ON COLUMN cml_orders.customer_phone IS 'Телефон клиента для экспорта в 1С';
COMMENT ON COLUMN cml_orders.customer_country IS 'Страна клиента для экспорта в 1С';
COMMENT ON COLUMN cml_orders.customer_city IS 'Город клиента для экспорта в 1С';
COMMENT ON COLUMN cml_orders.customer_address IS 'Адрес клиента для экспорта в 1С';
