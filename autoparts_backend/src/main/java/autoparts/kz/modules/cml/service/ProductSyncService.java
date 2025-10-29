package autoparts.kz.modules.cml.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Сервис для синхронизации товаров из cml_products в основную таблицу products
 */
@Service
public class ProductSyncService {

    private static final Logger log = LoggerFactory.getLogger(ProductSyncService.class);

    private final JdbcTemplate jdbcTemplate;

    public ProductSyncService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Синхронизирует товары из cml_products в products
     * Использует guid из cml_products как external_code в products
     */
    @Transactional
    public int syncProductsFromCml() {
        log.info("🔄 Starting product synchronization from cml_products to products...");

        // 1. Синхронизируем товары (INSERT новых + UPDATE существующих)
        String syncProductsSql = """
            INSERT INTO products (name, code, description, external_code, price, stock)
            SELECT 
                cp.name,
                cp.sku,
                cp.description,
                cp.guid,  -- используем guid как external_code для связи
                COALESCE(
                    (SELECT pr.value 
                     FROM cml_prices pr 
                     WHERE pr.product_guid = cp.guid 
                     LIMIT 1), 
                    0
                ),
                COALESCE(
                    (SELECT SUM(st.quantity) 
                     FROM cml_stocks st 
                     WHERE st.product_guid = cp.guid), 
                    0
                )
            FROM cml_products cp
            ON CONFLICT (external_code) 
            DO UPDATE SET
                name = EXCLUDED.name,
                code = EXCLUDED.code,
                description = EXCLUDED.description,
                price = EXCLUDED.price,
                stock = EXCLUDED.stock
            """;

        // Сначала добавим unique constraint на external_code если его нет
        try {
            String checkConstraint = """
                DO $$ 
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint 
                        WHERE conname = 'uk_products_external_code'
                    ) THEN
                        ALTER TABLE products ADD CONSTRAINT uk_products_external_code UNIQUE (external_code);
                    END IF;
                END $$;
                """;
            jdbcTemplate.execute(checkConstraint);
            log.debug("✅ Ensured unique constraint exists on products.external_code");
        } catch (Exception e) {
            log.warn("Could not ensure unique constraint on external_code: {}", e.getMessage());
        }

        int productsCount = jdbcTemplate.update(syncProductsSql);
        log.info("✅ Synchronized {} products from cml_products to products", productsCount);
        
        // 2. НОВОЕ: Обновляем цены и остатки для ВСЕХ товаров по external_code
        // Даже для тех, что не были синхронизированы из cml_products
        String updatePricesSql = """
            UPDATE products p
            SET 
                price = COALESCE(
                    (SELECT pr.value 
                     FROM cml_prices pr 
                     WHERE pr.product_guid = p.external_code 
                     LIMIT 1), 
                    p.price
                ),
                stock = COALESCE(
                    (SELECT SUM(st.quantity) 
                     FROM cml_stocks st 
                     WHERE st.product_guid = p.external_code), 
                    p.stock
                )
            WHERE p.external_code IS NOT NULL
              AND EXISTS (
                  SELECT 1 FROM cml_prices pr2 
                  WHERE pr2.product_guid = p.external_code
              )
            """;
        
        int updatedPrices = jdbcTemplate.update(updatePricesSql);
        log.info("✅ Updated prices and stocks for {} additional products", updatedPrices);
        
        return productsCount + updatedPrices;
    }

    /**
     * Синхронизирует свойства товаров из cml_product_attributes в product_properties
     */
    @Transactional
    public int syncProductProperties() {
        log.info("🔄 Starting product properties synchronization...");

        String sql = """
            INSERT INTO product_properties (product_id, property_name, property_value)
            SELECT 
                p.id,
                cpa.attr_key,
                cpa.attr_value
            FROM cml_product_attributes cpa
            JOIN cml_products cp ON cpa.product_id = cp.id
            JOIN products p ON p.external_code = cp.guid
            ON CONFLICT (product_id, property_name) 
            DO UPDATE SET
                property_value = EXCLUDED.property_value
            """;

        // Добавим unique constraint если его нет
        try {
            String checkConstraint = """
                DO $$ 
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint 
                        WHERE conname = 'uk_product_properties_product_name'
                    ) THEN
                        ALTER TABLE product_properties ADD CONSTRAINT uk_product_properties_product_name UNIQUE (product_id, property_name);
                    END IF;
                END $$;
                """;
            jdbcTemplate.execute(checkConstraint);
            log.debug("✅ Ensured unique constraint exists on product_properties");
        } catch (Exception e) {
            log.warn("Could not ensure unique constraint on product_properties: {}", e.getMessage());
        }

        int count = jdbcTemplate.update(sql);
        
        log.info("✅ Synchronized {} product properties", count);
        
        return count;
    }

    /**
     * Полная синхронизация: товары + свойства
     */
    @Transactional
    public int fullSync() {
        int productsCount = syncProductsFromCml();
        int propertiesCount = syncProductProperties();
        
        log.info("🎉 Full sync completed: {} products, {} properties", productsCount, propertiesCount);
        
        return productsCount;
    }
}
