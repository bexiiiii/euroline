--liquibase formatted sql
--changeset autoparts:create-admin-notification-campaigns

CREATE TABLE IF NOT EXISTS admin_notification_campaigns
(
    id          BIGSERIAL PRIMARY KEY,
    title       VARCHAR(180)        NOT NULL,
    message     TEXT                NOT NULL,
    status      BOOLEAN             NOT NULL DEFAULT TRUE,
    target      VARCHAR(32),
    image_url   VARCHAR(512),
    sender_id   BIGINT,
    created_at  TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_notification_campaign_sender FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_notification_campaigns_created_at
    ON admin_notification_campaigns (created_at DESC);

ALTER TABLE admin_notifications
    ADD COLUMN IF NOT EXISTS campaign_id BIGINT;

ALTER TABLE admin_notifications
    ADD CONSTRAINT fk_admin_notification_campaign
        FOREIGN KEY (campaign_id) REFERENCES admin_notification_campaigns (id) ON DELETE SET NULL;

