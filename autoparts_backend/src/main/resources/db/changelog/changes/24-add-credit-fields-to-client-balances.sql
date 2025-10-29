-- Adds per-client credit configuration and personal QR link
ALTER TABLE client_balances
    ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(18,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS credit_used NUMERIC(18,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS qr_code_url TEXT,
    ADD COLUMN IF NOT EXISTS qr_code_key TEXT;

ALTER TABLE client_balances
    ALTER COLUMN credit_limit SET DEFAULT 0,
    ALTER COLUMN credit_used SET DEFAULT 0;

-- Add constraints if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ck_client_balance_credit_non_negative'
    ) THEN
        ALTER TABLE client_balances
            ADD CONSTRAINT ck_client_balance_credit_non_negative CHECK (credit_used >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ck_client_balance_credit_within_limit'
    ) THEN
        ALTER TABLE client_balances
            ADD CONSTRAINT ck_client_balance_credit_within_limit CHECK (credit_used <= credit_limit);
    END IF;
END $$;
