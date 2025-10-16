--liquibase formatted sql

--changeset behruz:add-1c-integration-fields-to-refund-requests
--comment: Добавляет поля для интеграции возвратов с 1C через CommerceML

ALTER TABLE refund_requests
ADD COLUMN sent_to_1c BOOLEAN DEFAULT FALSE,
ADD COLUMN sent_to_1c_at TIMESTAMP,
ADD COLUMN external_id VARCHAR(255);

CREATE INDEX idx_refund_requests_sent_to_1c ON refund_requests(sent_to_1c);
CREATE INDEX idx_refund_requests_external_id ON refund_requests(external_id);

--rollback ALTER TABLE refund_requests DROP COLUMN sent_to_1c, DROP COLUMN sent_to_1c_at, DROP COLUMN external_id;
--rollback DROP INDEX IF EXISTS idx_refund_requests_sent_to_1c;
--rollback DROP INDEX IF EXISTS idx_refund_requests_external_id;
