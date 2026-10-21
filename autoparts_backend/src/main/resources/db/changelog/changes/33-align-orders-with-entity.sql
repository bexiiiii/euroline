-- Bring the original orders table forward to the current Order entity without
-- rewriting historical records. New site orders populate these fields normally.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS external_id VARCHAR(36);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(64);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id BIGINT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address VARCHAR(500);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_external_id
    ON orders (external_id)
    WHERE external_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_idempotency_key
    ON orders (idempotency_key)
    WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id);
