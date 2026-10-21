package autoparts.kz.modules.onecEvents.service;

import autoparts.kz.modules.category.entity.Category;
import autoparts.kz.modules.category.repository.CategoryRepository;
import autoparts.kz.modules.manualProducts.entity.Product;
import autoparts.kz.modules.manualProducts.entity.ProductProperty;
import autoparts.kz.modules.manualProducts.repository.ProductRepository;
import autoparts.kz.modules.onecEvents.dto.OneCEventRequest;
import autoparts.kz.modules.order.entity.Order;
import autoparts.kz.modules.order.entity.OrderItem;
import autoparts.kz.modules.order.orderStatus.OrderStatus;
import autoparts.kz.modules.order.repository.OrderRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class OneCEventService {
    private static final String PRODUCT_UPDATED = "product.updated";
    private static final java.util.Set<String> KNOWN_EVENT_TYPES = java.util.Set.of(
            "integration.ping", "product.updated", "stock.updated", "price.updated",
            "warehouse.updated",
            "order.created", "order.updated", "order.cancelled",
            "sale.created", "sale.updated", "sale.cancelled",
            "return.created", "return.updated", "return.cancelled"
    );
    private static final java.util.Set<String> ACTIVE_EVENT_TYPES = java.util.Set.of(
            "integration.ping", "product.updated", "stock.updated", "price.updated",
            "warehouse.updated",
            "order.created", "order.updated", "order.cancelled"
    );

    private final String bearerToken;
    private final JdbcTemplate jdbcTemplate;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final OrderRepository orderRepository;

    public OneCEventService(
            @Value("${onec.events.token:}") String bearerToken,
            JdbcTemplate jdbcTemplate,
            ProductRepository productRepository,
            CategoryRepository categoryRepository,
            OrderRepository orderRepository
    ) {
        this.bearerToken = bearerToken;
        this.jdbcTemplate = jdbcTemplate;
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.orderRepository = orderRepository;
    }

    public void validateAuthorization(String authorization) {
        if (bearerToken == null || bearerToken.isBlank() || authorization == null || !authorization.startsWith("Bearer ")) {
            throw badRequest("Invalid 1C authorization token");
        }

        byte[] expected = bearerToken.getBytes(StandardCharsets.UTF_8);
        byte[] actual = authorization.substring("Bearer ".length()).getBytes(StandardCharsets.UTF_8);
        if (!MessageDigest.isEqual(expected, actual)) {
            throw badRequest("Invalid 1C authorization token");
        }
    }

    /**
     * Registers an event before mutating a product. Both steps share one transaction,
     * so failed handling is rolled back and can safely be retried by 1C.
     */
    @Transactional
    public boolean accept(OneCEventRequest event, String rawPayload) {
        UUID eventId = requiredUuid(event.eventId(), "eventId");
        require(event.eventType(), "eventType");
        require(event.source(), "source");
        if (!KNOWN_EVENT_TYPES.contains(event.eventType())) {
            throw badRequest("Unsupported 1C event type");
        }
        if (!ACTIVE_EVENT_TYPES.contains(event.eventType())) {
            throw badRequest("Document events are not enabled until the V18 payload contract is verified");
        }

        int inserted = jdbcTemplate.update(
                "INSERT INTO incoming_1c_events " +
                        "(event_id, event_type, source, http_status, payload, received_at, processed_at) " +
                        "VALUES (?, ?, ?, 200, CAST(? AS jsonb), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
                        "ON CONFLICT (event_id) DO UPDATE SET http_status = 200, error_message = NULL, " +
                        "payload = EXCLUDED.payload, received_at = CURRENT_TIMESTAMP, processed_at = CURRENT_TIMESTAMP " +
                        "WHERE incoming_1c_events.http_status >= 500",
                eventId, event.eventType(), event.source(), rawPayload
        );
        if (inserted == 0) {
            return false;
        }

        // Retained for compatibility with the initial deployment audit table.
        jdbcTemplate.update(
                "INSERT INTO onec_integration_events (event_id, event_type, source, payload) " +
                        "VALUES (?, ?, ?, CAST(? AS jsonb)) ON CONFLICT (event_id) DO NOTHING",
                eventId, event.eventType(), event.source(), rawPayload
        );

        switch (event.eventType()) {
            case "integration.ping" -> { /* delivery and auth check only */ }
            case PRODUCT_UPDATED -> applyProductUpdate(event, rawPayload);
            case "stock.updated" -> applyStockUpdate(event, rawPayload);
            case "price.updated" -> applyPriceUpdate(event, rawPayload);
            case "warehouse.updated" -> applyWarehouseUpdate(event);
            case "order.created", "order.updated", "order.cancelled" -> applyOrderUpdate(event);
            default -> throw new IllegalStateException("Unexpected active event type");
        }
        return true;
    }

    private void applyProductUpdate(OneCEventRequest event, String rawPayload) {
        if (!"product".equals(event.entity())) {
            throw badRequest("product.updated entity must be product");
        }
        JsonNode data = event.data();
        if (data == null || !data.isObject()) {
            throw badRequest("product.updated data must be an object");
        }
        if (data.path("isFolder").asBoolean(false)) {
            return;
        }

        String refKey = require(event.refKey(), "refKey");
        String dataRefKey = require(data.path("refKey").asText(null), "data.refKey");
        if (!refKey.equals(dataRefKey)) {
            throw badRequest("refKey must match data.refKey");
        }

        Product product = productRepository.findByOneCRefKey(refKey).orElseGet(Product::new);
        boolean newProduct = product.getId() == null;

        product.setOneCRefKey(refKey);
        if (data.path("exists").asBoolean(true) && !data.path("deletionMark").asBoolean(false)) {
            product.setName(require(data.path("name").asText(null), "data.name"));
            product.setCode(require(data.path("code").asText(null), "data.code"));
            product.setSku(attribute(data, "Артикул", "article", "sku"));
            String brand = attribute(data, "Бренд", "brand");
            if (brand != null && !brand.isBlank()) {
                product.setBrand(brand);
            } else if (newProduct) {
                product.setBrand("1C");
            }
            if (newProduct) {
                product.setExternalCode(refKey);
            }
            mergeAttributes(product, data.path("attributes"));
            applyProductCategory(product, data);
            applyProductPrices(product, refKey, data.path("prices"), rawPayload);
            applyStoredAvailability(product, refKey);
        } else if (!newProduct) {
            // Не удаляем товар физически: он может быть связан с заказами.
            // Нулевой остаток снимает его с продажи до отдельной политики архивирования.
            product.setStock(0);
            product.setReservedStock(0);
        } else {
            // Сообщение об уже удалённой номенклатуре не должно создавать товар на витрине.
            return;
        }

        productRepository.save(product);
    }

    /** Creates a stable site category from the 1C category/group reference and links the product to it. */
    private void applyProductCategory(Product product, JsonNode data) {
        String refKey = firstText(data, null, "categoryRefKey", "category_ref_key");
        String name = firstText(data, null, "categoryName", "category_name");
        if (refKey == null || name == null || name.isBlank()) {
            return;
        }
        String slug = "onec-" + refKey.toLowerCase(java.util.Locale.ROOT);
        Category category = categoryRepository.findBySlug(slug).orElseGet(Category::new);
        category.setName(name.trim());
        category.setSlug(slug);
        category.setIsActive(true);
        product.setCategory(categoryRepository.save(category));
    }

    private void applyStockUpdate(OneCEventRequest event, String rawPayload) {
        if (event.data() != null && event.data().isArray()) {
            applyStockRegisterRows(event.data());
            return;
        }
        JsonNode data = objectData(event, "stock.updated");
        String productRefKey = firstText(data, event.refKey(), "productRefKey", "product_ref_key");
        String warehouseRefKey = firstText(data, null, "warehouseRefKey", "warehouse_ref_key");
        BigDecimal quantity = firstDecimal(data, "quantity", "stock", "available", "remainder");
        if (productRefKey == null || warehouseRefKey == null || quantity == null) {
            throw badRequest("stock.updated requires productRefKey, warehouseRefKey and quantity");
        }
        String warehouseName = firstText(data, null, "warehouseName", "warehouse_name");
        if (warehouseName != null) {
            upsertWarehouseName(warehouseRefKey, warehouseName, data.toString());
        }
        jdbcTemplate.update(
                "INSERT INTO onec_stocks (product_ref_key, warehouse_ref_key, warehouse_name, quantity, payload, updated_at) " +
                        "VALUES (?, ?, ?, ?, CAST(? AS jsonb), CURRENT_TIMESTAMP) " +
                        "ON CONFLICT (product_ref_key, warehouse_ref_key) DO UPDATE SET " +
                        "warehouse_name = EXCLUDED.warehouse_name, quantity = EXCLUDED.quantity, " +
                        "payload = EXCLUDED.payload, updated_at = CURRENT_TIMESTAMP",
                productRefKey, warehouseRefKey, warehouseName, quantity, rawPayload
        );
        syncProductStock(productRefKey);
    }

    /**
     * 1C sends stock.updated as rows of the ТоварыНаСкладах register. Several rows may
     * share a product and warehouse (series, characteristic, storage room), so they are
     * summed per (product, warehouse) before the upsert. Free stock is ВНаличии minus
     * КОтгрузке: КОтгрузке is already promised to shipment orders. Rows for products
     * the site does not know yet are still stored; product.updated reads them later.
     */
    private void applyStockRegisterRows(JsonNode rows) {
        Map<String, Map<String, BigDecimal>> quantities = new LinkedHashMap<>();
        Map<String, Map<String, ArrayNode>> payloads = new LinkedHashMap<>();
        for (JsonNode row : rows) {
            if (!row.isObject()) {
                throw badRequest("Each stock.updated row must be an object");
            }
            String productRefKey = firstText(row, null, "НоменклатураRefKey", "productRefKey", "product_ref_key");
            String warehouseRefKey = firstText(row, null, "СкладRefKey", "warehouseRefKey", "warehouse_ref_key");
            BigDecimal inStock = firstDecimal(row, "ВНаличии", "quantity", "stock", "available", "remainder");
            if (productRefKey == null || warehouseRefKey == null || inStock == null) {
                throw badRequest("stock.updated row requires НоменклатураRefKey, СкладRefKey and ВНаличии");
            }
            BigDecimal toShip = firstDecimal(row, "КОтгрузке");
            BigDecimal available = toShip == null ? inStock : inStock.subtract(toShip);
            quantities.computeIfAbsent(productRefKey, key -> new LinkedHashMap<>())
                    .merge(warehouseRefKey, available, BigDecimal::add);
            payloads.computeIfAbsent(productRefKey, key -> new LinkedHashMap<>())
                    .computeIfAbsent(warehouseRefKey, key -> JsonNodeFactory.instance.arrayNode())
                    .add(row);
        }
        quantities.forEach((productRefKey, byWarehouse) -> byWarehouse.forEach((warehouseRefKey, quantity) ->
                jdbcTemplate.update(
                        "INSERT INTO onec_stocks (product_ref_key, warehouse_ref_key, warehouse_name, quantity, payload, updated_at) " +
                                "VALUES (?, ?, (SELECT name FROM onec_warehouses WHERE ref_key = ?), ?, CAST(? AS jsonb), CURRENT_TIMESTAMP) " +
                                "ON CONFLICT (product_ref_key, warehouse_ref_key) DO UPDATE SET " +
                                "warehouse_name = COALESCE(EXCLUDED.warehouse_name, onec_stocks.warehouse_name), " +
                                "quantity = EXCLUDED.quantity, payload = EXCLUDED.payload, updated_at = CURRENT_TIMESTAMP",
                        productRefKey, warehouseRefKey, warehouseRefKey, quantity.max(BigDecimal.ZERO),
                        payloads.get(productRefKey).get(warehouseRefKey).toString()
                )));
        quantities.keySet().forEach(this::syncProductStock);
    }

    /**
     * Справочник складов 1С. Остатки (stock.updated) приходят только с СкладRefKey,
     * поэтому название склада берётся отсюда. data — объект склада или массив объектов.
     */
    private void applyWarehouseUpdate(OneCEventRequest event) {
        JsonNode data = event.data();
        if (data == null || !(data.isObject() || data.isArray())) {
            throw badRequest("warehouse.updated data must be an object or an array");
        }
        if (data.isObject()) {
            upsertWarehouse(data, event.refKey());
            return;
        }
        for (JsonNode warehouse : data) {
            if (!warehouse.isObject()) {
                throw badRequest("Each warehouse.updated item must be an object");
            }
            upsertWarehouse(warehouse, null);
        }
    }

    private void upsertWarehouse(JsonNode data, String fallbackRefKey) {
        String refKey = require(firstText(data, fallbackRefKey, "refKey", "Ref_Key", "СкладRefKey"), "data.refKey");
        String name = firstText(data, null, "name", "Description", "Наименование");
        String code = firstText(data, null, "code", "Code", "Код");
        boolean deleted = data.path("deletionMark").asBoolean(data.path("DeletionMark").asBoolean(false))
                || !data.path("exists").asBoolean(true);
        jdbcTemplate.update(
                "INSERT INTO onec_warehouses (ref_key, name, code, deletion_mark, payload, updated_at) " +
                        "VALUES (?, ?, ?, ?, CAST(? AS jsonb), CURRENT_TIMESTAMP) " +
                        "ON CONFLICT (ref_key) DO UPDATE SET name = COALESCE(EXCLUDED.name, onec_warehouses.name), " +
                        "code = COALESCE(EXCLUDED.code, onec_warehouses.code), deletion_mark = EXCLUDED.deletion_mark, " +
                        "payload = EXCLUDED.payload, updated_at = CURRENT_TIMESTAMP",
                refKey, name, code, deleted, data.toString()
        );
        if (name != null) {
            jdbcTemplate.update("UPDATE onec_stocks SET warehouse_name = ? WHERE warehouse_ref_key = ?", name, refKey);
        }
    }

    private void upsertWarehouseName(String refKey, String name, String payload) {
        jdbcTemplate.update(
                "INSERT INTO onec_warehouses (ref_key, name, code, deletion_mark, payload, updated_at) " +
                        "VALUES (?, ?, NULL, FALSE, CAST(? AS jsonb), CURRENT_TIMESTAMP) " +
                        "ON CONFLICT (ref_key) DO UPDATE SET name = EXCLUDED.name, " +
                        "payload = EXCLUDED.payload, updated_at = CURRENT_TIMESTAMP",
                refKey, name, payload
        );
    }

    private void applyPriceUpdate(OneCEventRequest event, String rawPayload) {
        JsonNode data = event.data();
        if (data == null || !(data.isObject() || data.isArray())) {
            throw badRequest("price.updated data must be an object or an array");
        }
        if (data.isArray()) {
            for (JsonNode row : data) {
                if (!row.isObject()) {
                    throw badRequest("Each price.updated row must be an object");
                }
                applySinglePrice(row, event.refKey(), row.toString(), null);
            }
            return;
        }
        applySinglePrice(data, event.refKey(), rawPayload, null);
    }

    /** Prices included in product.updated are the authoritative initial snapshot. */
    private void applyProductPrices(Product product, String productRefKey, JsonNode prices, String rawPayload) {
        if (prices == null || !prices.isArray()) {
            return;
        }
        for (JsonNode price : prices) {
            if (price.isObject()) {
                applySinglePrice(price, productRefKey, price.toString(), product);
            }
        }
    }

    private void applySinglePrice(JsonNode data, String fallbackProductRefKey, String rawPayload, Product loadedProduct) {
        String productRefKey = require(firstText(data, fallbackProductRefKey,
                "productRefKey", "product_ref_key", "НоменклатураRefKey"), "data.productRefKey");
        String priceTypeRefKey = firstText(data, "default",
                "priceTypeRefKey", "priceType", "price_type_ref_key", "ВидЦеныRefKey");
        BigDecimal amount = firstDecimal(data, "price", "amount", "value", "Цена");
        String currency = firstText(data, null, "currencyRefKey", "currency", "currencyCode", "ВалютаRefKey");

        jdbcTemplate.update(
                "INSERT INTO onec_prices (product_ref_key, price_type_ref_key, amount, currency, payload, updated_at) " +
                        "VALUES (?, ?, ?, ?, CAST(? AS jsonb), CURRENT_TIMESTAMP) " +
                        "ON CONFLICT (product_ref_key, price_type_ref_key) DO UPDATE SET amount = EXCLUDED.amount, " +
                        "currency = EXCLUDED.currency, payload = EXCLUDED.payload, updated_at = CURRENT_TIMESTAMP",
                productRefKey, priceTypeRefKey, amount, currency, rawPayload
        );
        if (amount == null) {
            return;
        }
        if (loadedProduct != null) {
            loadedProduct.setPrice(amount.intValue());
            return;
        }
        productRepository.findByOneCRefKey(productRefKey).ifPresent(product -> {
            product.setPrice(amount.intValue());
            productRepository.save(product);
        });
    }

    /**
     * 1C is authoritative for the current snapshot of an order, but it must never
     * create a second order on the site. The site order is identified by the
     * siteOrderId sent by the outbound integration (public code or external UUID).
     */
    private void applyOrderUpdate(OneCEventRequest event) {
        if (!"order".equals(event.entity())) {
            throw badRequest(event.eventType() + " entity must be order");
        }
        JsonNode data = objectData(event, event.eventType());
        String siteOrderId = require(firstText(data, null, "siteOrderId"), "data.siteOrderId");
        Order order = orderRepository.findSiteOrderWithItems(siteOrderId)
                .orElseThrow(() -> badRequest("Site order was not found for data.siteOrderId"));

        String oneCRefKey = require(event.refKey(), "refKey");
        if (order.getOneCRefKey() != null && !order.getOneCRefKey().equals(oneCRefKey)) {
            throw badRequest("1C order refKey does not match the existing site order");
        }
        order.setOneCRefKey(oneCRefKey);

        String warehouseRefKey = firstText(data, null,
                "warehouseRefKey", "warehouse_ref_key", "СкладRefKey");
        if (warehouseRefKey != null) {
            order.setOneCWarehouseRefKey(warehouseRefKey);
        }
        String comment = firstText(data, null, "comment", "Комментарий");
        if (comment != null) {
            order.setOneCComment(comment);
        }

        if ("order.cancelled".equals(event.eventType())) {
            order.setStatus(OrderStatus.CANCELLED);
        } else {
            order.setStatus(statusFromOneC(firstText(data, null, "Статус", "status")));
            JsonNode items = firstArray(data, "items", "Товары");
            if (items != null) {
                replaceOrderItems(order, items);
            }
        }
        orderRepository.save(order);
    }

    private JsonNode firstArray(JsonNode data, String... names) {
        for (String name : names) {
            JsonNode value = data.get(name);
            if (value != null && !value.isNull()) {
                if (!value.isArray()) {
                    throw badRequest("data." + name + " must be an array");
                }
                return value;
            }
        }
        return null;
    }

    private void replaceOrderItems(Order order, JsonNode items) {
        ArrayList<OrderItem> replacement = new ArrayList<>();
        for (JsonNode item : items) {
            if (!item.isObject()) {
                throw badRequest("Each order item must be an object");
            }
            String productRefKey = require(firstText(item, null,
                    "productRefKey", "product_ref_key", "НоменклатураRefKey"), "item.productRefKey");
            Product product = productRepository.findByOneCRefKey(productRefKey)
                    .orElseThrow(() -> badRequest("Product was not found for item.productRefKey"));
            BigDecimal quantity = firstDecimal(item, "quantity", "Количество");
            BigDecimal price = firstDecimal(item, "price", "Цена");
            if (quantity == null || quantity.signum() <= 0 || quantity.stripTrailingZeros().scale() > 0) {
                throw badRequest("item.quantity must be a positive whole number");
            }
            if (price == null || price.signum() < 0) {
                throw badRequest("item.price must be a non-negative number");
            }
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setSku(product.getSku() == null || product.getSku().isBlank() ? product.getCode() : product.getSku());
            orderItem.setQuantity(quantity.intValueExact());
            orderItem.setPrice(price);
            replacement.add(orderItem);
        }
        if (order.getItems() == null) {
            order.setItems(replacement);
        } else {
            order.getItems().clear();
            order.getItems().addAll(replacement);
        }
    }

    private OrderStatus statusFromOneC(String sourceStatus) {
        if (sourceStatus == null || sourceStatus.isBlank()) {
            return OrderStatus.PENDING;
        }
        String normalized = sourceStatus.trim().toLowerCase(java.util.Locale.ROOT);
        if (normalized.contains("отмен") || normalized.contains("cancel")) {
            return OrderStatus.CANCELLED;
        }
        if (normalized.contains("подтверж") || normalized.contains("confirm")) {
            return OrderStatus.CONFIRMED;
        }
        return OrderStatus.PENDING;
    }

    private void applyStoredAvailability(Product product, String refKey) {
        BigDecimal price = jdbcTemplate.query(
                "SELECT amount FROM onec_prices WHERE product_ref_key = ? AND amount IS NOT NULL " +
                        "ORDER BY updated_at DESC LIMIT 1",
                statement -> statement.setString(1, refKey),
                resultSet -> resultSet.next() ? resultSet.getBigDecimal(1) : null
        );
        if (price != null) {
            product.setPrice(price.intValue());
        }
        BigDecimal stock = jdbcTemplate.query(
                "SELECT COALESCE(SUM(quantity), 0) FROM onec_stocks WHERE product_ref_key = ?",
                statement -> statement.setString(1, refKey),
                resultSet -> resultSet.next() ? resultSet.getBigDecimal(1) : BigDecimal.ZERO
        );
        product.setStock(stock.intValue());
    }

    private void syncProductStock(String refKey) {
        productRepository.findByOneCRefKey(refKey).ifPresent(product -> {
            BigDecimal stock = jdbcTemplate.query(
                    "SELECT COALESCE(SUM(quantity), 0) FROM onec_stocks WHERE product_ref_key = ?",
                    statement -> statement.setString(1, refKey),
                    resultSet -> resultSet.next() ? resultSet.getBigDecimal(1) : BigDecimal.ZERO
            );
            product.setStock(stock.intValue());
            productRepository.save(product);
        });
    }

    private JsonNode objectData(OneCEventRequest event, String type) {
        if (event.data() == null || !event.data().isObject()) {
            throw badRequest(type + " data must be an object");
        }
        return event.data();
    }

    private String firstText(JsonNode data, String fallback, String... names) {
        for (String name : names) {
            JsonNode value = data.get(name);
            if (value != null && !value.isNull() && !value.asText().isBlank()) {
                return value.asText();
            }
        }
        return fallback == null || fallback.isBlank() ? null : fallback;
    }

    private BigDecimal firstDecimal(JsonNode data, String... names) {
        for (String name : names) {
            JsonNode value = data.get(name);
            if (value == null || value.isNull() || value.asText().isBlank()) {
                continue;
            }
            try {
                return value.decimalValue();
            } catch (NumberFormatException ignored) {
                throw badRequest(name + " must be numeric");
            }
        }
        return null;
    }

    private void mergeAttributes(Product product, JsonNode attributes) {
        if (attributes == null || !attributes.isObject()) {
            return;
        }
        Map<String, ProductProperty> existing = new HashMap<>();
        for (ProductProperty property : product.getProperties()) {
            existing.put(property.getPropertyName(), property);
        }
        attributes.fields().forEachRemaining(entry -> {
            String value = entry.getValue().isValueNode() ? entry.getValue().asText() : entry.getValue().toString();
            ProductProperty property = existing.get(entry.getKey());
            if (property == null) {
                property = new ProductProperty();
                property.setProduct(product);
                property.setPropertyName(entry.getKey());
                product.getProperties().add(property);
            }
            property.setPropertyValue(value);
        });
    }

    private String attribute(JsonNode data, String... names) {
        JsonNode attributes = data.path("attributes");
        if (!attributes.isObject()) {
            return null;
        }
        for (String name : names) {
            JsonNode value = attributes.get(name);
            if (value != null && !value.isNull()) {
                return value.asText();
            }
        }
        return null;
    }

    private UUID requiredUuid(String value, String field) {
        try {
            return UUID.fromString(require(value, field));
        } catch (IllegalArgumentException exception) {
            throw badRequest(field + " must be a UUID");
        }
    }

    private String require(String value, String field) {
        if (value == null || value.isBlank()) {
            throw badRequest(field + " is required");
        }
        return value;
    }

    private IllegalArgumentException badRequest(String message) {
        // RestExceptionHandler maps IllegalArgumentException to HTTP 400.
        // ResponseStatusException is intentionally avoided because the legacy generic
        // RuntimeException advice would otherwise turn it into a 500 response.
        return new IllegalArgumentException(message);
    }
}
