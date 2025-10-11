--liquibase formatted sql

--changeset autoparts:create-cml-domain-tables
CREATE TABLE IF NOT EXISTS cml_customers (
    id BIGSERIAL PRIMARY KEY,
    guid VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS cml_products (
    id BIGSERIAL PRIMARY KEY,
    guid VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(255) NOT NULL,
    description TEXT,
    category_id BIGINT
);

CREATE TABLE IF NOT EXISTS cml_product_attributes (
    product_id BIGINT NOT NULL,
    attr_key VARCHAR(255) NOT NULL,
    attr_value TEXT,
    PRIMARY KEY (product_id, attr_key),
    FOREIGN KEY (product_id) REFERENCES cml_products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cml_prices (
    id BIGSERIAL PRIMARY KEY,
    product_guid VARCHAR(255) NOT NULL,
    price_type_guid VARCHAR(255) NOT NULL,
    value NUMERIC(19, 2) NOT NULL,
    currency VARCHAR(16) NOT NULL,
    CONSTRAINT uk_price_product_type UNIQUE (product_guid, price_type_guid)
);

CREATE TABLE IF NOT EXISTS cml_stocks (
    id BIGSERIAL PRIMARY KEY,
    product_guid VARCHAR(255) NOT NULL,
    warehouse_guid VARCHAR(255) NOT NULL,
    quantity NUMERIC(19, 2) NOT NULL,
    CONSTRAINT uk_stock_product_warehouse UNIQUE (product_guid, warehouse_guid)
);

CREATE TABLE IF NOT EXISTS cml_orders (
    id BIGSERIAL PRIMARY KEY,
    guid VARCHAR(255) NOT NULL UNIQUE,
    number VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL,
    status VARCHAR(64) NOT NULL,
    total NUMERIC(19, 2) NOT NULL,
    customer_guid VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS cml_order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_guid VARCHAR(255) NOT NULL,
    price NUMERIC(19, 2) NOT NULL,
    qty NUMERIC(19, 2) NOT NULL,
    sum NUMERIC(19, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES cml_orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cml_prices_product ON cml_prices (product_guid);
CREATE INDEX IF NOT EXISTS idx_cml_stocks_product ON cml_stocks (product_guid);
CREATE INDEX IF NOT EXISTS idx_cml_stocks_warehouse ON cml_stocks (warehouse_guid);
CREATE INDEX IF NOT EXISTS idx_cml_orders_customer ON cml_orders (customer_guid);
CREATE INDEX IF NOT EXISTS idx_cml_orders_created_at ON cml_orders (created_at);

--rollback DROP INDEX IF EXISTS idx_cml_orders_created_at;
--rollback DROP INDEX IF EXISTS idx_cml_orders_customer;
--rollback DROP INDEX IF EXISTS idx_cml_stocks_warehouse;
--rollback DROP INDEX IF EXISTS idx_cml_stocks_product;
--rollback DROP INDEX IF EXISTS idx_cml_prices_product;
--rollback DROP TABLE IF EXISTS cml_order_items;
--rollback DROP TABLE IF EXISTS cml_orders;
--rollback DROP TABLE IF EXISTS cml_stocks;
--rollback DROP TABLE IF EXISTS cml_prices;
--rollback DROP TABLE IF EXISTS cml_product_attributes;
--rollback DROP TABLE IF EXISTS cml_products;
--rollback DROP TABLE IF EXISTS cml_customers;
