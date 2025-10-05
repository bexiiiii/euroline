--liquibase formatted sql

--changeset admin:17-create-news-table
CREATE TABLE news (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    cover_image_url VARCHAR(500),
    content TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create function to update timestamp
--changeset admin:18-create-news-timestamp-func runOnChange:true
CREATE OR REPLACE FUNCTION update_news_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS '
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
';

-- Create trigger to automatically update timestamp
--changeset admin:19-create-news-timestamp-trigger runOnChange:true
DROP TRIGGER IF EXISTS set_news_timestamp ON news;

CREATE TRIGGER set_news_timestamp
BEFORE UPDATE ON news
FOR EACH ROW
EXECUTE PROCEDURE update_news_timestamp();

--rollback DROP TABLE news;