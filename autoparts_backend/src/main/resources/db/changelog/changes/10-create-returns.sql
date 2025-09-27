--liquibase formatted sql

--changeset codex:10-create-returns
CREATE TABLE IF NOT EXISTS return_requests (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    reason TEXT,
    status VARCHAR(50) NOT NULL,
    amount DECIMAL(19,2),
    details_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_return_requests_customer ON return_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_order ON return_requests(order_id);

--rollback DROP TABLE IF EXISTS return_requests;

