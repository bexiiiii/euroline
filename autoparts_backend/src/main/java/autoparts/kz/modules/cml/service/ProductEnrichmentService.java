package autoparts.kz.modules.cml.service;

import autoparts.kz.common.util.ArticleNormalizationUtil;
import autoparts.kz.modules.cml.domain.entity.CmlPrice;
import autoparts.kz.modules.cml.domain.entity.CmlStock;
import autoparts.kz.modules.cml.dto.WarehouseStockDTO;
import autoparts.kz.modules.cml.repo.CmlPriceRepository;
import autoparts.kz.modules.cml.repo.CmlStockRepository;
import autoparts.kz.modules.manualProducts.entity.Product;
import autoparts.kz.modules.manualProducts.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Сервис для обогащения поиска и карточек товара данными, синхронизированными из 1С.
 *
 * Источники:
 *  - таблица products (локальная копия каталогов)
 *  - onec_prices / onec_stocks (JSON-вебхук 1С, ключ products.onec_ref_key) — приоритетный источник
 *  - cml_prices / cml_stocks (последние выгрузки CommerceML, ключ products.external_code) — fallback
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProductEnrichmentService {

    private final ProductRepository productRepository;
    private final CmlStockRepository cmlStockRepository;
    private final CmlPriceRepository cmlPriceRepository;
    private final NamedParameterJdbcTemplate namedJdbcTemplate;
    private final autoparts.kz.modules.pricing.CustomerPriceService customerPriceService;

    /**
     * Обогатить данные о товаре по OEM.
     */
    @Transactional(readOnly = true)
    public Optional<EnrichmentData> enrichByArticle(String articleNumber) {
        if (articleNumber == null || articleNumber.trim().isEmpty()) {
            return Optional.empty();
        }

        return productRepository.findByArticle(articleNumber.trim())
                .flatMap(this::enrichProduct);
    }

    /**
     * Обогащение отдельного товара.
     */
    @Transactional(readOnly = true)
    public Optional<EnrichmentData> enrichProduct(Product product) {
        if (product == null) {
            return Optional.empty();
        }
        Map<Long, EnrichmentData> enriched = enrichProducts(List.of(product));
        return Optional.ofNullable(enriched.get(product.getId()));
    }

    /**
     * Обогатить список товаров сущностей.
     */
    @Transactional(readOnly = true)
    public Map<Long, EnrichmentData> enrichProducts(List<Product> products) {
        if (products == null || products.isEmpty()) {
            return Map.of();
        }

        List<String> externalCodes = products.stream()
                .map(Product::getExternalCode)
                .filter(code -> code != null && !code.trim().isEmpty())
                .map(String::trim)
                .distinct()
                .toList();

        Map<String, List<WarehouseStockDTO>> stocksByGuid = externalCodes.isEmpty()
                ? Map.of()
                : loadStocksByGuid(externalCodes);

        Map<String, BigDecimal> pricesByGuid = externalCodes.isEmpty()
                ? Map.of()
                : loadPricesByGuid(externalCodes);

        List<String> oneCRefKeys = products.stream()
                .map(Product::getOneCRefKey)
                .filter(key -> key != null && !key.trim().isEmpty())
                .map(String::trim)
                .distinct()
                .toList();

        Map<String, List<WarehouseStockDTO>> oneCStocksByRef = oneCRefKeys.isEmpty()
                ? Map.of()
                : loadOneCStocksByRef(oneCRefKeys);

        Map<String, BigDecimal> oneCPricesByRef = oneCRefKeys.isEmpty()
                ? Map.of()
                : loadOneCPricesByRef(oneCRefKeys);

        Map<Long, EnrichmentData> result = new HashMap<>(products.size());

        for (Product product : products) {
            EnrichmentData data = new EnrichmentData();
            data.setProductId(product.getId());
            data.setExternalCode(product.getExternalCode());
            data.setName(product.getName());
            data.setBrand(product.getBrand());
            data.setImageUrl(product.getImageUrl());
            data.setProductCode(product.getCode());

            Integer price = product.getPrice();
            Integer stock = product.getStock();

            String refKey = product.getOneCRefKey() == null || product.getOneCRefKey().isBlank()
                    ? null : product.getOneCRefKey().trim();
            data.setOneCProduct(refKey != null);
            List<WarehouseStockDTO> oneCWarehouses = refKey == null
                    ? List.of()
                    : oneCStocksByRef.getOrDefault(refKey, List.of());
            BigDecimal oneCPrice = refKey == null ? null : oneCPricesByRef.get(refKey);

            List<WarehouseStockDTO> warehouses;
            if (!oneCWarehouses.isEmpty()) {
                // Остатки из JSON-вебхука 1С — актуальнее products.stock и CommerceML.
                warehouses = oneCWarehouses;
                stock = sumQuantities(oneCWarehouses);
                data.setFromOneCEvents(true);
            } else {
                warehouses = stocksByGuid.getOrDefault(product.getExternalCode(), List.of());
                if ((stock == null || stock == 0) && !warehouses.isEmpty()) {
                    stock = sumQuantities(warehouses);
                }
            }

            if (oneCPrice != null) {
                price = toInteger(oneCPrice);
                data.setFromOneCEvents(true);
            } else if (price == null) {
                price = toInteger(pricesByGuid.get(product.getExternalCode()));
            }

            data.setPrice(price);
            data.setStock(stock);
            data.setWarehouses(warehouses.isEmpty() ? List.of() : List.copyOf(warehouses));
            data.setFoundInLocalDb(true);

            log.debug("Enriched product {} (externalCode={}): price={}, stock={}, warehouses={}",
                    product.getId(),
                    product.getExternalCode(),
                    data.getPrice(),
                    data.getStock(),
                    warehouses.size());

            result.put(product.getId(), data);
        }

        return result;
    }

    /**
     * Обогащение по списку OEM кодов. Возвращает мапу: нормализованный OEM → данные.
     */
    @Transactional(readOnly = true)
    public Map<String, EnrichmentData> enrichByCodes(List<String> codes) {
        if (codes == null || codes.isEmpty()) {
            return Map.of();
        }

        List<String> normalized = codes.stream()
                .filter(Objects::nonNull)
                .map(ArticleNormalizationUtil::normalize)
                .filter(s -> s != null && !s.isBlank())
                .distinct()
                .toList();

        if (normalized.isEmpty()) {
            return Map.of();
        }

        List<String> normalizedLower = normalized.stream()
                .map(String::toLowerCase)
                .toList();

        List<Product> products = productRepository.findAllByArticleIn(normalizedLower);
        if (products.isEmpty()) {
            return Map.of();
        }

        Map<Long, EnrichmentData> byId = enrichProducts(products);
        Map<String, EnrichmentData> result = new HashMap<>();

        for (Product product : products) {
            EnrichmentData data = byId.get(product.getId());
            if (data == null) {
                continue;
            }

            String article = product.getCode() != null ? product.getCode() : product.getSku();
            if (article == null || article.isBlank()) {
                continue;
            }
            String normalizedKey = ArticleNormalizationUtil.normalize(article);
            if (normalizedKey != null && !normalizedKey.isBlank()) {
                result.put(normalizedKey, data);
            }
        }

        return result;
    }

    /**
     * Детализация складов по GUID товара.
     */
    @Transactional(readOnly = true)
    public List<WarehouseStockDTO> getWarehouseStocks(String productGuid) {
        if (productGuid == null || productGuid.trim().isEmpty()) {
            return List.of();
        }

        return cmlStockRepository.findAllByProductGuid(productGuid).stream()
                .map(stock -> new WarehouseStockDTO(stock.getWarehouseGuid(), stock.getQuantity()))
                .collect(Collectors.toList());
    }

    private Map<String, List<WarehouseStockDTO>> loadStocksByGuid(List<String> externalCodes) {
        Map<String, List<WarehouseStockDTO>> grouped = cmlStockRepository.findAllByProductGuidIn(externalCodes).stream()
                .collect(Collectors.groupingBy(
                        CmlStock::getProductGuid,
                        Collectors.mapping(
                                stock -> new WarehouseStockDTO(stock.getWarehouseGuid(), stock.getQuantity()),
                                Collectors.toList()
                        )
                ));

        grouped.replaceAll((guid, warehouses) -> warehouses == null ? List.of() : List.copyOf(warehouses));
        return grouped;
    }

    /**
     * Остатки из onec_stocks (stock.updated / product.updated вебхука 1С), сгруппированные по product_ref_key.
     */
    private Map<String, List<WarehouseStockDTO>> loadOneCStocksByRef(List<String> refKeys) {
        Map<String, List<WarehouseStockDTO>> grouped = new LinkedHashMap<>();
        try {
            namedJdbcTemplate.query(
                    "SELECT product_ref_key, warehouse_ref_key, warehouse_name, quantity FROM onec_stocks " +
                            "WHERE product_ref_key IN (:refKeys) ORDER BY product_ref_key, warehouse_name, warehouse_ref_key",
                    new MapSqlParameterSource("refKeys", refKeys),
                    rs -> {
                        WarehouseStockDTO dto = new WarehouseStockDTO(rs.getString("warehouse_ref_key"), rs.getBigDecimal("quantity"));
                        dto.setWarehouseName(rs.getString("warehouse_name"));
                        grouped.computeIfAbsent(rs.getString("product_ref_key"), key -> new java.util.ArrayList<>()).add(dto);
                    }
            );
        } catch (Exception e) {
            log.warn("Failed to load onec_stocks for {} products: {}", refKeys.size(), e.getMessage());
            return Map.of();
        }
        grouped.replaceAll((ref, warehouses) -> List.copyOf(warehouses));
        return grouped;
    }

    /**
     * Цена из onec_prices по виду цены текущего клиента (опт / розница, см. CustomerPriceService).
     * Раньше бралась последняя цена любого вида — так на витрину попадала приходная (закупочная).
     */
    private Map<String, BigDecimal> loadOneCPricesByRef(List<String> refKeys) {
        Map<String, BigDecimal> prices = new HashMap<>();
        try {
            namedJdbcTemplate.query(
                    "SELECT DISTINCT ON (product_ref_key) product_ref_key, amount FROM onec_prices " +
                            "WHERE product_ref_key IN (:refKeys) AND price_type_ref_key = :priceType AND amount > 0 " +
                            "ORDER BY product_ref_key, updated_at DESC",
                    new MapSqlParameterSource("refKeys", refKeys)
                            .addValue("priceType", customerPriceService.currentPriceType()),
                    rs -> {
                        prices.put(rs.getString("product_ref_key"), rs.getBigDecimal("amount"));
                    }
            );
        } catch (Exception e) {
            log.warn("Failed to load onec_prices for {} products: {}", refKeys.size(), e.getMessage());
            return Map.of();
        }
        return prices;
    }

    private Map<String, BigDecimal> loadPricesByGuid(List<String> externalCodes) {
        return cmlPriceRepository.findAllByProductGuidIn(externalCodes).stream()
                .collect(Collectors.toMap(
                        CmlPrice::getProductGuid,
                        CmlPrice::getValue,
                        BigDecimal::min
                ));
    }

    private Integer sumQuantities(List<WarehouseStockDTO> warehouses) {
        if (warehouses == null || warehouses.isEmpty()) {
            return null;
        }

        BigDecimal total = warehouses.stream()
                .map(WarehouseStockDTO::getQuantity)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return toInteger(total);
    }

    private Integer toInteger(BigDecimal value) {
        if (value == null) {
            return null;
        }
        BigDecimal scaled = value.setScale(0, RoundingMode.HALF_UP);

        if (scaled.compareTo(BigDecimal.valueOf(Integer.MAX_VALUE)) > 0) {
            return Integer.MAX_VALUE;
        }
        if (scaled.compareTo(BigDecimal.valueOf(Integer.MIN_VALUE)) < 0) {
            return Integer.MIN_VALUE;
        }
        return scaled.intValue();
    }

    /**
     * DTO для обогащенных CommerceML данных.
     */
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class EnrichmentData {
        private Long productId;
        private Integer price;
        private Integer stock;
        private String externalCode;
        private List<WarehouseStockDTO> warehouses;
        private boolean foundInLocalDb;
        private String name;
        private String brand;
        private String imageUrl;
        private String productCode;
        /** true, если цена/остатки взяты из onec_prices / onec_stocks (JSON-вебхук 1С). */
        private boolean fromOneCEvents;
        /** true, если товар пришёл из 1С (есть onec_ref_key): его название главнее внешних каталогов. */
        private boolean oneCProduct;
    }
}
