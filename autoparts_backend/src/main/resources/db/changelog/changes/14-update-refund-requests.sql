ALTER TABLE refund_requests
    ADD COLUMN IF NOT EXISTS admin_comment VARCHAR(1024);
