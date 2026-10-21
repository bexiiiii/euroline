--liquibase formatted sql

--changeset autoparts:create-onec-warehouses
CREATE TABLE IF NOT EXISTS onec_warehouses (
    ref_key VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255),
    code VARCHAR(64),
    deletion_mark BOOLEAN NOT NULL DEFAULT FALSE,
    payload JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
