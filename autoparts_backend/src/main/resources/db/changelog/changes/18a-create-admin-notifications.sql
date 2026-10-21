--liquibase formatted sql
--changeset autoparts:create-admin-notifications

CREATE TABLE IF NOT EXISTS admin_notifications
(
    id          BIGSERIAL PRIMARY KEY,
    title       VARCHAR(255),
    message     TEXT,
    status      BOOLEAN NOT NULL DEFAULT TRUE,
    read        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    user_id     BIGINT,
    CONSTRAINT fk_admin_notification_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

