ALTER TABLE order_outbox ADD COLUMN IF NOT EXISTS command_json TEXT;
ALTER TABLE order_outbox ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE order_outbox ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMP;
ALTER TABLE order_outbox ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP;
ALTER TABLE order_outbox ADD COLUMN IF NOT EXISTS last_error TEXT;
CREATE INDEX IF NOT EXISTS idx_order_outbox_due ON order_outbox (next_attempt_at, created_at)
    WHERE status='NEW' AND event_type='OrderCreated';
