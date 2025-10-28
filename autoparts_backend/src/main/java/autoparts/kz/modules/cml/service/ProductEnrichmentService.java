package autoparts.kz.modules.cml.service;

import autoparts.kz.modules.cml.domain.entity.CmlStock;
import autoparts.kz.modules.cml.dto.WarehouseStockDTO;
import autoparts.kz.modules.cml.repo.CmlStockRepository;
import autoparts.kz.modules.manualProducts.entity.Product;
import autoparts.kz.modules.manualProducts.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Сервис для обогащения результатов поиска данными из 1С
 * 
 * Основные задачи:
 * 1. Найти товар в нашей БД по артикулу/коду
 * 2. Подставить актуальные цены из products (синхронизированные из 1С)
 * 3. Подставить актуальные остатки из products
 * 4. Добавить детализацию по складам из cml_stocks
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProductEnrichmentService {

    private final ProductRepository productRepository;
    private final CmlStockRepository cmlStockRepository;

    /**
     * Обогатить данные о товаре ценой и остатками из 1С
     * 
     * @param articleNumber артикул товара (OEM код)
     * @return данные о цене и остатках, если товар найден в БД
     */
    @Transactional(readOnly = true)
    public Optional<EnrichmentData> enrichByArticle(String articleNumber) {
        if (articleNumber == null || articleNumber.trim().isEmpty()) {
            return Optional.empty();
        }

        // Ищем товар в нашей БД по артикулу
        Optional<Product> productOpt = productRepository.findByArticle(articleNumber.trim());
        
        if (productOpt.isEmpty()) {
            log.debug("Product not found in local DB for article: {}", articleNumber);
            return Optional.empty();
        }

        Product product = productOpt.get();
        
        // Получаем детализацию по складам
        List<WarehouseStockDTO> warehouses = getWarehouseStocks(product.getExternalCode());
        
        EnrichmentData data = new EnrichmentData();
        data.setProductId(product.getId());
        data.setPrice(product.getPrice());
        data.setStock(product.getStock());
        data.setExternalCode(product.getExternalCode());
        data.setWarehouses(warehouses);
        data.setFoundInLocalDb(true);
        
        log.debug("Enriched product data for article {}: price={}, stock={}, warehouses={}", 
                  articleNumber, data.getPrice(), data.getStock(), warehouses.size());
        
        return Optional.of(data);
    }

    /**
     * Получить детализацию остатков по складам
     * 
     * @param productGuid GUID товара в 1С (external_code)
     * @return список складов с остатками
     */
    @Transactional(readOnly = true)
    public List<WarehouseStockDTO> getWarehouseStocks(String productGuid) {
        if (productGuid == null || productGuid.trim().isEmpty()) {
            return List.of();
        }

        List<CmlStock> stocks = cmlStockRepository.findAllByProductGuid(productGuid);
        
        return stocks.stream()
                .map(stock -> new WarehouseStockDTO(
                        stock.getWarehouseGuid(),
                        stock.getQuantity()
                ))
                .collect(Collectors.toList());
    }

    /**
     * 🚀 OPTIMIZED: Массовое обогащение списка артикулов
     * Вместо N×3 запросов делает всего 2 запроса (products + stocks)
     * 
     * @param articleNumbers список артикулов
     * @return мапа: артикул → данные обогащения
     */
    @Transactional(readOnly = true)
    public java.util.Map<String, EnrichmentData> enrichBatch(List<String> articleNumbers) {
        if (articleNumbers == null || articleNumbers.isEmpty()) {
            return java.util.Map.of();
        }

        // Шаг 1: Нормализуем артикулы (lowercase, trim, distinct)
        List<String> normalizedArticles = articleNumbers.stream()
                .filter(article -> article != null && !article.trim().isEmpty())
                .map(String::trim)
                .map(String::toLowerCase)
                .distinct()
                .toList();
        
        if (normalizedArticles.isEmpty()) {
            return java.util.Map.of();
        }

        log.debug("🚀 Batch enriching {} articles with 2 queries instead of {}×3", 
                  normalizedArticles.size(), normalizedArticles.size());

        // Шаг 2: ⚡ ОДИН ЗАПРОС для всех товаров (вместо N запросов)
        List<Product> products = productRepository.findAllByArticleIn(normalizedArticles);
        
        if (products.isEmpty()) {
            log.debug("No products found in local DB for {} articles", normalizedArticles.size());
            return java.util.Map.of();
        }

        // Шаг 3: ⚡ ОДИН ЗАПРОС для всех остатков по складам (вместо N запросов)
        List<String> productGuids = products.stream()
                .map(Product::getExternalCode)
                .filter(guid -> guid != null && !guid.trim().isEmpty())
                .distinct()
                .toList();
        
        List<CmlStock> allStocks = productGuids.isEmpty() 
                ? List.of() 
                : cmlStockRepository.findAllByProductGuidIn(productGuids);

        // Шаг 4: Группируем остатки по GUID товара для быстрого доступа
        java.util.Map<String, List<WarehouseStockDTO>> stocksByGuid = allStocks.stream()
                .collect(Collectors.groupingBy(
                        CmlStock::getProductGuid,
                        Collectors.mapping(
                                stock -> new WarehouseStockDTO(stock.getWarehouseGuid(), stock.getQuantity()),
                                Collectors.toList()
                        )
                ));

        // Шаг 5: Собираем результат в мапу: артикул → EnrichmentData
        java.util.Map<String, EnrichmentData> result = new java.util.HashMap<>();
        
        for (Product product : products) {
            EnrichmentData data = new EnrichmentData();
            data.setProductId(product.getId());
            data.setPrice(product.getPrice());
            data.setStock(product.getStock());
            data.setExternalCode(product.getExternalCode());
            data.setFoundInLocalDb(true);
            
            // Добавляем остатки по складам (если есть)
            List<WarehouseStockDTO> warehouses = stocksByGuid.getOrDefault(
                    product.getExternalCode(), 
                    List.of()
            );
            data.setWarehouses(warehouses);
            
            // Используем код товара как ключ (нормализованный)
            String articleKey = product.getCode() != null 
                    ? product.getCode().toLowerCase().trim() 
                    : product.getSku().toLowerCase().trim();
            
            result.put(articleKey, data);
        }

        log.debug("✅ Batch enrichment completed: found {}/{} products in 2 queries", 
                  result.size(), normalizedArticles.size());

        return result;
    }

    /**
     * DTO для обогащенных данных
     */
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class EnrichmentData {
        /**
         * ID товара в нашей БД
         */
        private Long productId;
        
        /**
         * Актуальная цена из 1С
         */
        private Integer price;
        
        /**
         * Суммарный остаток со всех складов
         */
        private Integer stock;
        
        /**
         * GUID товара в 1С для связи
         */
        private String externalCode;
        
        /**
         * Детализация по складам
         */
        private List<WarehouseStockDTO> warehouses;
        
        /**
         * Флаг: найден ли товар в нашей БД
         */
        private boolean foundInLocalDb;
    }
}
