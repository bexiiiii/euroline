--liquibase formatted sql

--changeset autoparts:create-banners
CREATE TABLE IF NOT EXISTS banners (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255),
    image_url VARCHAR(255),
    link_url VARCHAR(255),
    status VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE
);

--changeset autoparts:create-app-settings
CREATE TABLE IF NOT EXISTS app_settings (
    cfg_key VARCHAR(255) PRIMARY KEY,
    cfg_value VARCHAR(4000),
    updated_at TIMESTAMP WITH TIME ZONE
);

--changeset autoparts:create-error-logs
CREATE TABLE IF NOT EXISTS error_logs (
    id BIGSERIAL PRIMARY KEY,
    level VARCHAR(255),
    message TEXT,
    stacktrace TEXT,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
