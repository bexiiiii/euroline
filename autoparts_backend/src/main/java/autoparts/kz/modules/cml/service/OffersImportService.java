package autoparts.kz.modules.cml.service;

import autoparts.kz.modules.cml.config.CommerceMlProperties;
import autoparts.kz.modules.cml.parser.CmlOffersParser.OfferRecord;
import autoparts.kz.modules.cml.parser.CmlOffersParser.PriceRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class OffersImportService {

    private static final Logger log = LoggerFactory.getLogger(OffersImportService.class);

    private static final String UPSERT_PRICE = """
            INSERT INTO cml_prices (product_guid, price_type_guid, value, currency)
            VALUES (?, ?, ?, ?)
            ON CONFLICT (product_guid, price_type_guid) DO UPDATE SET
                value = EXCLUDED.value,
                currency = EXCLUDED.currency
            """;

    private static final String UPSERT_STOCK = """
            INSERT INTO cml_stocks (product_guid, warehouse_guid, quantity)
            VALUES (?, ?, ?)
            ON CONFLICT (product_guid, warehouse_guid) DO UPDATE SET
                quantity = EXCLUDED.quantity
            """;

    private final JdbcTemplate jdbcTemplate;
    private final CommerceMlProperties properties;

    public OffersImportService(JdbcTemplate jdbcTemplate, CommerceMlProperties properties) {
        this.jdbcTemplate = jdbcTemplate;
        this.properties = properties;
    }

    @Transactional
    public void upsertOffers(List<OfferRecord> offers) {
        for (OfferRecord offer : offers) {
            // Сохраняем остатки по каждому складу
            for (var warehouse : offer.warehouses()) {
                jdbcTemplate.update(UPSERT_STOCK,
                        offer.productGuid(),
                        warehouse.warehouseGuid(),
                        warehouse.quantity());
            }
            
            // Сохраняем цены
            for (PriceRecord price : offer.prices()) {
                jdbcTemplate.update(UPSERT_PRICE,
                        offer.productGuid(),
                        price.priceTypeGuid(),
                        price.value(),
                        price.currency());
            }
        }
        log.info("Processed {} offers (batch target {})", offers.size(), properties.getBatchSize());
    }
}
