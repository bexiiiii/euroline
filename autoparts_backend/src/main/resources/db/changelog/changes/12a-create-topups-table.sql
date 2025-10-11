--liquibase formatted sql

--changeset autoparts:create-topups-table
CREATE TABLE IF NOT EXISTS top_ups (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL,
    amount DECIMAL(19, 2) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    receipt_url VARCHAR(512)
);

CREATE INDEX IF NOT EXISTS idx_top_ups_client_id ON top_ups (client_id);

--rollback DROP INDEX IF EXISTS idx_top_ups_client_id;
--rollback DROP TABLE IF EXISTS top_ups;
