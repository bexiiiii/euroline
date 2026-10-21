ALTER TABLE cart_item
    ADD COLUMN IF NOT EXISTS warehouse_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS warehouse_ref_key VARCHAR(64);
