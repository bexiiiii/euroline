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
     * Массовое обогащение списка артикулов
     * Полезно для оптимизации множественных поисков
     * 
     * @param articleNumbers список артикулов
     * @return мапа: артикул → данные обогащения
     */
    @Transactional(readOnly = true)
    public java.util.Map<String, EnrichmentData> enrichBatch(List<String> articleNumbers) {
        if (articleNumbers == null || articleNumbers.isEmpty()) {
            return java.util.Map.of();
        }

        return articleNumbers.stream()
                .distinct()
                .map(this::enrichByArticle)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toMap(
                        // Используем external_code как ключ, но можно сделать по-другому
                        EnrichmentData::getExternalCode,
                        data -> data,
                        (existing, replacement) -> existing // если дубликаты, берём первый
                ));
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
