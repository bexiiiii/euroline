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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
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
 *  - cml_prices / cml_stocks (последние выгрузки CommerceML)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProductEnrichmentService {

    private final ProductRepository productRepository;
    private final CmlStockRepository cmlStockRepository;
    private final CmlPriceRepository cmlPriceRepository;

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

            List<WarehouseStockDTO> warehouses = stocksByGuid.getOrDefault(
                    product.getExternalCode(),
                    List.of()
            );

            if (price == null) {
                price = toInteger(pricesByGuid.get(product.getExternalCode()));
            }

            if ((stock == null || stock == 0) && !warehouses.isEmpty()) {
                stock = sumQuantities(warehouses);
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
    }
}
