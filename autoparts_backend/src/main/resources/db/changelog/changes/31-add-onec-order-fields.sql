ALTER TABLE orders ADD COLUMN IF NOT EXISTS onec_ref_key VARCHAR(64);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS onec_warehouse_ref_key VARCHAR(64);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS onec_comment TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_onec_ref_key
    ON orders (onec_ref_key)
    WHERE onec_ref_key IS NOT NULL;
