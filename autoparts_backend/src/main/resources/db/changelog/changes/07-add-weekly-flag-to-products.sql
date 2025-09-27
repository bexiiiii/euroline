--liquibase formatted sql

--changeset codex:07-add-weekly-flag-to-products
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_weekly BOOLEAN NOT NULL DEFAULT FALSE;

--rollback ALTER TABLE products DROP COLUMN IF EXISTS is_weekly;

