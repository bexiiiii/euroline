--liquibase formatted sql

--changeset autoparts:create-finance-support-tables
CREATE TABLE IF NOT EXISTS client_balances (
    client_id BIGINT PRIMARY KEY,
    balance DECIMAL(19, 2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS finance_txn (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL,
    type VARCHAR(32) NOT NULL,
    amount DECIMAL(19, 2) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_finance_txn_client_id ON finance_txn (client_id);

CREATE TABLE IF NOT EXISTS refund_requests (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL,
    order_id BIGINT,
    amount DECIMAL(19, 2),
    status VARCHAR(32) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_refund_requests_client_id ON refund_requests (client_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests (status);

--rollback DROP INDEX IF EXISTS idx_refund_requests_status;
--rollback DROP INDEX IF EXISTS idx_refund_requests_client_id;
--rollback DROP TABLE IF EXISTS refund_requests;
--rollback DROP INDEX IF EXISTS idx_finance_txn_client_id;
--rollback DROP TABLE IF EXISTS finance_txn;
--rollback DROP TABLE IF EXISTS client_balances;
