--liquibase formatted sql
--changeset autoparts:optimize-notifications-orders

CREATE INDEX IF NOT EXISTS idx_admin_notifications_recipient_created_at
    ON admin_notifications (recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_campaign_id
    ON admin_notifications (campaign_id);

CREATE INDEX IF NOT EXISTS idx_orders_status_created_at
    ON orders (status, created_at);

--rollback DROP INDEX IF EXISTS idx_admin_notifications_recipient_created_at;
--rollback DROP INDEX IF EXISTS idx_admin_notifications_campaign_id;
--rollback DROP INDEX IF EXISTS idx_orders_status_created_at;
