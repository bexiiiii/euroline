package autoparts.kz.modules.cml.service;

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
 * Сервис для обогащения результатов поиска данными из 1С.
 *
 * Основные задачи:
 * 1. Найти товар в нашей БД по идентификаторам 1С
 * 2. Подставить актуальные цены из cml_prices
 * 3. Подставить актуальные остатки из cml_stocks
 * 4. Добавить детализацию по складам
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProductEnrichmentService {

    private final ProductRepository productRepository;
    private final CmlStockRepository cmlStockRepository;
    private final CmlPriceRepository cmlPriceRepository;

    /**
     * Обогатить данные о товаре ценой и остатками из 1С по артикулу.
     *
     * @param articleNumber артикул товара (OEM код)
     * @return данные о цене и остатках, если товар найден
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
     * Обогатить единичный товар.
     *
     * @param product сущность товара
     * @return данные обогащения, если удалось собрать информацию
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
     * 🚀 Оптимизированное обогащение списка товаров.
     * Делает суммарно по два запроса в таблицы cml_prices и cml_stocks вместо N×3.
     *
     * @param products список товаров
     * @return мапа: ID товара → данные обогащения
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

            // Базовые значения из таблицы products
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

            boolean hasExternalData = pricesByGuid.containsKey(product.getExternalCode())
                    || !warehouses.isEmpty();
            data.setFoundInLocalDb(hasExternalData);

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
     * Получить детализацию остатков по складам.
     *
     * @param productGuid GUID товара в 1С (external_code)
     * @return список складов с остатками
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
     * DTO для обогащенных данных.
     */
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class EnrichmentData {
        /**
         * ID товара в нашей БД.
         */
        private Long productId;

        /**
         * Актуальная цена из 1С.
         */
        private Integer price;

        /**
         * Суммарный остаток со всех складов.
         */
        private Integer stock;

        /**
         * GUID товара в 1С для связи.
         */
        private String externalCode;

        /**
         * Детализация по складам.
         */
        private List<WarehouseStockDTO> warehouses;

        /**
         * Флаг: найдены ли данные в cml_* таблицах.
         */
        private boolean foundInLocalDb;
    }
}
