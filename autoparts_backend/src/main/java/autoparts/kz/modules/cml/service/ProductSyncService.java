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

        String sql = """
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
            jdbcTemplate.execute(
                "ALTER TABLE products ADD CONSTRAINT uk_products_external_code UNIQUE (external_code)"
            );
            log.info("✅ Added unique constraint on products.external_code");
        } catch (Exception e) {
            log.debug("Unique constraint already exists or couldn't be added: {}", e.getMessage());
        }

        int count = jdbcTemplate.update(sql);
        
        log.info("✅ Synchronized {} products from cml_products to products", count);
        
        return count;
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
            jdbcTemplate.execute(
                "ALTER TABLE product_properties ADD CONSTRAINT uk_product_properties_product_name UNIQUE (product_id, property_name)"
            );
            log.info("✅ Added unique constraint on product_properties");
        } catch (Exception e) {
            log.debug("Unique constraint already exists or couldn't be added: {}", e.getMessage());
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
