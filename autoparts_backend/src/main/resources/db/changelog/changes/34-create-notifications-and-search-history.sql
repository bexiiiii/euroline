--liquibase formatted sql

--changeset autoparts:create-user-notifications
CREATE TABLE IF NOT EXISTS notifications (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT,
    title      VARCHAR(255),
    body       VARCHAR(4000),
    type       VARCHAR(32),
    severity   VARCHAR(32),
    read_flag  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP(6) WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications (user_id) WHERE read_flag = FALSE;

--changeset autoparts:create-customer-search-history
CREATE TABLE IF NOT EXISTS customer_search_history (
    id          BIGSERIAL PRIMARY KEY,
    customer_id BIGINT,
    query       VARCHAR(255),
    created_at  TIMESTAMP(6) WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_customer_search_history_customer_created ON customer_search_history (customer_id, created_at DESC);
