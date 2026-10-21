-- Outbox событий заказа (OutboxMessage, пишет OrderService при создании заказа).
-- Таблицы не было: создание заказа падало с 500 "relation order_outbox does not exist".
CREATE TABLE IF NOT EXISTS order_outbox (
    id             VARCHAR(36)  PRIMARY KEY,
    aggregate_type VARCHAR(64)  NOT NULL,
    aggregate_id   BIGINT       NOT NULL,
    event_type     VARCHAR(64)  NOT NULL,
    payload_json   TEXT         NOT NULL,
    status         VARCHAR(16)  NOT NULL DEFAULT 'NEW',
    created_at     TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outbox_status ON order_outbox (status);
