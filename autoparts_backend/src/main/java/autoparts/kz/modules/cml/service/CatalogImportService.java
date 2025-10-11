package autoparts.kz.modules.cml.service;

import autoparts.kz.modules.cml.config.CommerceMlProperties;
import autoparts.kz.modules.cml.parser.CmlImportParser.ProductRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.BatchPreparedStatementSetter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;

@Service
public class CatalogImportService {

    private static final Logger log = LoggerFactory.getLogger(CatalogImportService.class);

    private static final String UPSERT_PRODUCT = """
            INSERT INTO cml_products (guid, name, sku, description, category_id)
            VALUES (:guid, :name, :sku, :description, :categoryId)
            ON CONFLICT (guid) DO UPDATE SET
                name = EXCLUDED.name,
                sku = EXCLUDED.sku,
                description = EXCLUDED.description,
                category_id = EXCLUDED.category_id
            RETURNING id
            """;

    private static final String DELETE_ATTRS = "DELETE FROM cml_product_attributes WHERE product_id = ?";
    private static final String INSERT_ATTR = "INSERT INTO cml_product_attributes (product_id, attr_key, attr_value) VALUES (?, ?, ?)";

    private final NamedParameterJdbcTemplate namedTemplate;
    private final JdbcTemplate jdbcTemplate;
    private final CommerceMlProperties properties;

    public CatalogImportService(NamedParameterJdbcTemplate namedTemplate,
                                JdbcTemplate jdbcTemplate,
                                CommerceMlProperties properties) {
        this.namedTemplate = namedTemplate;
        this.jdbcTemplate = jdbcTemplate;
        this.properties = properties;
    }

    @Transactional
    public void upsertProducts(List<ProductRecord> batch) {
        for (ProductRecord record : batch) {
            Long productId = upsertProduct(record);
            Map<String, String> attrs = record.attributes();
            jdbcTemplate.update(DELETE_ATTRS, productId);
            if (!attrs.isEmpty()) {
                batchInsertAttributes(productId, attrs);
            }
        }
        log.info("Upserted {} products (batch size target {})", batch.size(), properties.getBatchSize());
    }

    private Long upsertProduct(ProductRecord record) {
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("guid", record.guid())
                .addValue("name", record.name())
                .addValue("sku", record.sku())
                .addValue("description", record.description())
                .addValue("categoryId", record.categoryId());
        return namedTemplate.queryForObject(UPSERT_PRODUCT, params, Long.class);
    }

    private void batchInsertAttributes(Long productId, Map<String, String> attrs) {
        List<Map.Entry<String, String>> entries = attrs.entrySet().stream().toList();
        jdbcTemplate.batchUpdate(INSERT_ATTR, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                Map.Entry<String, String> entry = entries.get(i);
                ps.setLong(1, productId);
                ps.setString(2, entry.getKey());
                ps.setString(3, entry.getValue());
            }

            @Override
            public int getBatchSize() {
                return entries.size();
            }
        });
    }
}
