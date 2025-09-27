--liquibase formatted sql

--changeset codex:08-add-weekly-period-to-products
ALTER TABLE products ADD COLUMN IF NOT EXISTS weekly_start_at TIMESTAMP;
ALTER TABLE products ADD COLUMN IF NOT EXISTS weekly_end_at TIMESTAMP;

--rollback ALTER TABLE products DROP COLUMN IF EXISTS weekly_end_at;
--rollback ALTER TABLE products DROP COLUMN IF EXISTS weekly_start_at;

