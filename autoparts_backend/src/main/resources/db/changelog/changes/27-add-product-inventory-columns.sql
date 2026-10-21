--liquibase formatted sql
--changeset autoparts:27-add-product-inventory-columns

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS reserved_stock INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS sku VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_products_sku
    ON products (sku);

