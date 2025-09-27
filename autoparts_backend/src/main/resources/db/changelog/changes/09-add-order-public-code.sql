--liquibase formatted sql

--changeset codex:add-order-public-code
-- Add public_code column to orders for user-visible code
ALTER TABLE orders ADD COLUMN IF NOT EXISTS public_code VARCHAR(10);

-- Ensure uniqueness via an index
CREATE UNIQUE INDEX IF NOT EXISTS ux_orders_public_code ON orders (public_code);

--changeset codex:backfill-order-public-code splitStatements:false
--validCheckSum: 9:971c75ac72fe7c83f7ea40bb5946ab8e
--validCheckSum: 9:3ca574667e0d4ce7b75ccfa058232a5c
-- Backfill existing rows with 5-char A-Z0-9 codes containing at least one letter and one digit
DO $$
DECLARE
    r RECORD;
    candidate TEXT;
    has_letter BOOLEAN;
    has_digit BOOLEAN;
BEGIN
    FOR r IN SELECT id FROM orders WHERE public_code IS NULL LOOP
        LOOP
            -- generate 5-char string from A-Z0-9
            candidate := (
                SELECT string_agg(ch, '') FROM (
                    SELECT substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', (1 + floor(random()*36))::int, 1) AS ch
                    FROM generate_series(1,5)
                ) s
            );
            has_letter := candidate ~ '[A-Z]';
            has_digit := candidate ~ '[0-9]';
            IF has_letter AND has_digit THEN
                BEGIN
                    UPDATE orders SET public_code = candidate WHERE id = r.id;
                    EXIT; -- success
                EXCEPTION WHEN unique_violation THEN
                    -- try again on collision
                END;
            END IF;
        END LOOP;
    END LOOP;
END;
$$;

--rollback DROP INDEX IF EXISTS ux_orders_public_code;
--rollback ALTER TABLE orders DROP COLUMN IF EXISTS public_code;
