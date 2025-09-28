--liquibase formatted sql

--changeset codex:11-create-categories
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    parent_id BIGINT,
    image_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE categories
    DROP CONSTRAINT IF EXISTS fk_categories_parent;

ALTER TABLE categories
    ADD CONSTRAINT fk_categories_parent
    FOREIGN KEY (parent_id)
    REFERENCES categories (id)
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories (parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories (sort_order);

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS category_id BIGINT;

ALTER TABLE products
    DROP CONSTRAINT IF EXISTS fk_products_category;

ALTER TABLE products
    ADD CONSTRAINT fk_products_category
    FOREIGN KEY (category_id)
    REFERENCES categories (id)
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products (category_id);

--rollback ALTER TABLE products DROP CONSTRAINT IF EXISTS fk_products_category;
--rollback DROP INDEX IF EXISTS idx_products_category_id;
--rollback ALTER TABLE products DROP COLUMN IF EXISTS category_id;
--rollback DROP INDEX IF EXISTS idx_categories_sort_order;
--rollback DROP INDEX IF EXISTS idx_categories_parent_id;
--rollback ALTER TABLE categories DROP CONSTRAINT IF EXISTS fk_categories_parent;
--rollback DROP TABLE IF EXISTS categories;
