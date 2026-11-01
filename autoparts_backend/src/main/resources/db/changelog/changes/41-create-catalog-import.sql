--liquibase formatted sql

--changeset autoparts:41-create-catalog-import
-- Импорт PDF-каталогов поставщиков из админки: задача (разбор в фоне) + распознанные строки для превью/правки.
CREATE TABLE IF NOT EXISTS catalog_import_jobs (
    id BIGSERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    source_key VARCHAR(500),
    brand VARCHAR(100) NOT NULL,
    parent_category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL,
    pages INTEGER NOT NULL DEFAULT 0,
    pages_done INTEGER NOT NULL DEFAULT 0,
    pages_without_text INTEGER NOT NULL DEFAULT 0,
    warnings TEXT,
    sections TEXT,
    error TEXT,
    created_count INTEGER NOT NULL DEFAULT 0,
    updated_count INTEGER NOT NULL DEFAULT 0,
    skipped_count INTEGER NOT NULL DEFAULT 0,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    committed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS catalog_import_items (
    id BIGSERIAL PRIMARY KEY,
    job_id BIGINT NOT NULL REFERENCES catalog_import_jobs(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    page INTEGER NOT NULL,
    section VARCHAR(500),
    code VARCHAR(100) NOT NULL,
    alt_code VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    name_tr VARCHAR(500),
    name_en VARCHAR(500),
    note TEXT,
    voltage VARCHAR(100),
    untranslated VARCHAR(500),
    image_key VARCHAR(500),
    image_url VARCHAR(500),
    included BOOLEAN NOT NULL DEFAULT TRUE,
    duplicate_in_file BOOLEAN NOT NULL DEFAULT FALSE,
    product_id BIGINT
);

CREATE INDEX IF NOT EXISTS idx_catalog_import_items_job ON catalog_import_items(job_id, position);
-- поиск существующего товара при повторном импорте: бренд + артикул
CREATE INDEX IF NOT EXISTS idx_products_brand_code_upper ON products (UPPER(brand), UPPER(code));
--rollback DROP TABLE IF EXISTS catalog_import_items; DROP TABLE IF EXISTS catalog_import_jobs; DROP INDEX IF EXISTS idx_products_brand_code_upper;
