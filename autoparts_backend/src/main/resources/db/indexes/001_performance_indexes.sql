-- =====================================================
-- Performance Optimization: Database Indexes
-- Created: 2025-10-14
-- Purpose: Add missing indexes to improve query performance
-- =====================================================

-- NOTE: Using CONCURRENTLY to avoid locking tables during index creation
-- This is safe for production but takes longer

-- =====================================================
-- 1. ORDERS TABLE - Critical for order management
-- =====================================================

-- Index for order status filtering (most common query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status 
ON orders(status);

-- Index for user's orders lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_id 
ON orders(user_id);

-- Index for date range queries and sorting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_created_at 
ON orders(created_at DESC);

-- Composite index for status + date (covers WHERE status AND ORDER BY date)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status_created 
ON orders(status, created_at DESC);

-- Index for tracking number lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_tracking_number 
ON orders(tracking_number) 
WHERE tracking_number IS NOT NULL;

-- =====================================================
-- 2. ORDER_ITEMS TABLE
-- =====================================================

-- Index for order items lookup by order
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_order_id 
ON order_items(order_id);

-- Index for product popularity analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_product_id 
ON order_items(product_id);

-- =====================================================
-- 3. PRODUCTS TABLE - Critical for search performance
-- =====================================================

-- Index for OEM number search (most important!)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_oem 
ON products(oem);

-- Index for product code lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_code 
ON products(code);

-- Index for brand filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_brand 
ON products(brand);

-- Index for category filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category_id 
ON products(category_id);

-- Index for stock status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_in_stock 
ON products(in_stock);

-- Index for price range queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_price 
ON products(price);

-- Full-text search index for product name (Russian language)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_name_fulltext 
ON products USING gin(to_tsvector('russian', name));

-- Full-text search index for product description
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_description_fulltext 
ON products USING gin(to_tsvector('russian', description));

-- Composite full-text index for name + description
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_fulltext 
ON products USING gin(to_tsvector('russian', coalesce(name, '') || ' ' || coalesce(description, '')));

-- Index for external code (VIN or other external references)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_external_code 
ON products(external_code) 
WHERE external_code IS NOT NULL;

-- =====================================================
-- 4. CARTS TABLE
-- =====================================================

-- Index for user's cart lookup (critical path)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_carts_user_id 
ON carts(user_id);

-- =====================================================
-- 5. CART_ITEMS TABLE
-- =====================================================

-- Index for cart items by cart
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cart_items_cart_id 
ON cart_items(cart_id);

-- Index for cart items by product
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cart_items_product_id 
ON cart_items(product_id);

-- Composite unique index to prevent duplicate items in cart
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_cart_items_cart_product_unique 
ON cart_items(cart_id, product_id);

-- =====================================================
-- 6. USERS TABLE
-- =====================================================

-- Index for email login lookup
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email 
ON users(email);

-- Index for phone number lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_phone_number 
ON users(phone_number) 
WHERE phone_number IS NOT NULL;

-- Index for user status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_banned 
ON users(banned);

-- Index for role-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role 
ON users(role);

-- =====================================================
-- 7. SEARCH_HISTORY TABLE - Important for analytics
-- =====================================================

-- Index for user's search history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_search_history_user_id 
ON search_history(user_id);

-- Index for date range queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_search_history_created_at 
ON search_history(created_at DESC);

-- Index for query analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_search_history_query 
ON search_history(query);

-- Index for result count analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_search_history_result_count 
ON search_history(result_count);

-- Composite index for user + date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_search_history_user_created 
ON search_history(user_id, created_at DESC);

-- Full-text search on queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_search_history_query_fulltext 
ON search_history USING gin(to_tsvector('russian', query));

-- =====================================================
-- 8. CATEGORIES TABLE
-- =====================================================

-- Index for parent category lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_parent_id 
ON categories(parent_id) 
WHERE parent_id IS NOT NULL;

-- Index for slug lookup
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_slug 
ON categories(slug);

-- Index for active categories
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_active 
ON categories(active) 
WHERE active = true;

-- =====================================================
-- 9. NOTIFICATIONS TABLE
-- =====================================================

-- Index for user's notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id 
ON admin_notifications(user_id);

-- Index for unread notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_read 
ON admin_notifications(read) 
WHERE read = false;

-- Index for notification status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_status 
ON admin_notifications(status);

-- Composite index for user + read status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_read 
ON admin_notifications(user_id, read);

-- =====================================================
-- 10. CLIENT_BALANCE TABLE - For financial queries
-- =====================================================

-- Index for user balance lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_client_balance_user_id 
ON client_balance(user_id);

-- =====================================================
-- 11. TRANSACTIONS TABLE
-- =====================================================

-- Index for user's transactions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_id 
ON client_balance_transaction(user_id) 
WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_balance_transaction');

-- Index for transaction date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_created_at 
ON client_balance_transaction(created_at DESC) 
WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_balance_transaction');

-- =====================================================
-- 12. CML_ORDERS TABLE - For 1C integration
-- =====================================================

-- Index for order number lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cml_orders_order_number 
ON cml_orders(order_number) 
WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cml_orders');

-- Index for processed status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cml_orders_processed 
ON cml_orders(processed) 
WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cml_orders');

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- After creating indexes, run these queries to verify they are being used:

-- 1. Check if index exists
-- SELECT schemaname, tablename, indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename IN ('orders', 'products', 'carts', 'users', 'search_history')
-- ORDER BY tablename, indexname;

-- 2. Check index usage statistics
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;

-- 3. Check table sizes and index sizes
-- SELECT
--     schemaname,
--     tablename,
--     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
--     pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
--     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- =====================================================
-- MAINTENANCE
-- =====================================================

-- Analyze tables to update statistics after index creation
ANALYZE orders;
ANALYZE order_items;
ANALYZE products;
ANALYZE carts;
ANALYZE cart_items;
ANALYZE users;
ANALYZE search_history;
ANALYZE categories;
ANALYZE admin_notifications;
ANALYZE client_balance;

-- Vacuum tables to reclaim space
-- VACUUM ANALYZE orders;
-- VACUUM ANALYZE products;
-- VACUUM ANALYZE carts;

-- =====================================================
-- PERFORMANCE TESTING
-- =====================================================

-- Test query performance before and after indexes
-- 
-- BEFORE: EXPLAIN ANALYZE SELECT * FROM products WHERE oem = 'ABC123';
-- AFTER: EXPLAIN ANALYZE SELECT * FROM products WHERE oem = 'ABC123';
-- 
-- Should show "Index Scan" instead of "Seq Scan"

-- =====================================================
-- NOTES
-- =====================================================
-- 
-- 1. CONCURRENTLY option allows index creation without locking
-- 2. IF NOT EXISTS prevents errors if index already exists
-- 3. WHERE clauses create partial indexes (smaller, faster)
-- 4. GIN indexes are for full-text search
-- 5. Remember to ANALYZE tables after creating indexes
-- 6. Monitor index usage with pg_stat_user_indexes
-- 7. Drop unused indexes to save space and improve write performance

-- =====================================================
-- END OF SCRIPT
-- =====================================================
