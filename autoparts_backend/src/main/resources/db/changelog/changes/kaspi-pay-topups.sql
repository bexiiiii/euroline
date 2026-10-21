--liquibase formatted sql

--changeset autoparts:kaspi-merchant-session
CREATE TABLE IF NOT EXISTS kaspi_merchant_session (
    id              BIGINT PRIMARY KEY,
    status          VARCHAR(32) NOT NULL DEFAULT 'DISCONNECTED',
    token_sn        VARCHAR(255),
    vtoken_secret   TEXT,
    profile_id      VARCHAR(64),
    organization_id VARCHAR(64),
    org_name        VARCHAR(512),
    phone           VARCHAR(32),
    last_error      VARCHAR(1024),
    connected_at    TIMESTAMP(6) WITH TIME ZONE,
    last_checked_at TIMESTAMP(6) WITH TIME ZONE,
    updated_at      TIMESTAMP(6) WITH TIME ZONE
);

--changeset autoparts:kaspi-top-up-columns
ALTER TABLE top_ups
    ADD COLUMN IF NOT EXISTS kaspi_type         VARCHAR(16),
    ADD COLUMN IF NOT EXISTS kaspi_operation_id BIGINT,
    ADD COLUMN IF NOT EXISTS kaspi_status       VARCHAR(64),
    ADD COLUMN IF NOT EXISTS kaspi_phone        VARCHAR(20),
    ADD COLUMN IF NOT EXISTS kaspi_qr_token     VARCHAR(1024),
    ADD COLUMN IF NOT EXISTS kaspi_expires_at   TIMESTAMP(6) WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS kaspi_checked_at   TIMESTAMP(6) WITH TIME ZONE;
-- One Euroline top-up per Kaspi operation: the DB guarantees a Kaspi payment can never be credited twice via two rows.
CREATE UNIQUE INDEX IF NOT EXISTS ux_top_ups_kaspi_operation
    ON top_ups (kaspi_type, kaspi_operation_id) WHERE kaspi_operation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_top_ups_kaspi_pending
    ON top_ups (kaspi_checked_at) WHERE kaspi_type IS NOT NULL AND status = 'PENDING';
