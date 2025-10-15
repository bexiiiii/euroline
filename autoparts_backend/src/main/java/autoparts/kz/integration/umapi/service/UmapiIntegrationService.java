package autoparts.kz.integration.umapi.service;

import autoparts.kz.integration.umapi.client.UmapiClient;
import autoparts.kz.integration.umapi.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * High-level service for UMAPI.ru integration
 * Provides business logic and caching
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UmapiIntegrationService {

    private final UmapiClient umapiClient;

    /**
     * Get all manufacturers for passenger cars
     * Cached for 24 hours
     */
    @Cacheable(cacheNames = "umapi-manufacturers", key = "'P'", unless = "#result == null || #result.isEmpty()")
    public List<ManufacturerDto> getPassengerManufacturers() {
        log.info("Fetching passenger car manufacturers from UMAPI");
        return umapiClient.getManufacturers("P");
    }

    /**
     * Get all manufacturers for commercial vehicles
     * Cached for 24 hours
     */
    @Cacheable(cacheNames = "umapi-manufacturers", key = "'C'", unless = "#result == null || #result.isEmpty()")
    public List<ManufacturerDto> getCommercialManufacturers() {
        log.info("Fetching commercial vehicle manufacturers from UMAPI");
        return umapiClient.getManufacturers("C");
    }

    /**
     * Get all manufacturers for motorbikes
     * Cached for 24 hours
     */
    @Cacheable(cacheNames = "umapi-manufacturers", key = "'M'", unless = "#result == null || #result.isEmpty()")
    public List<ManufacturerDto> getMotorbikeManufacturers() {
        log.info("Fetching motorbike manufacturers from UMAPI");
        return umapiClient.getManufacturers("M");
    }

    /**
     * Get models by manufacturer ID and vehicle type
     * Cached for 24 hours
     */
    @Cacheable(
            cacheNames = "umapi-models",
            key = "#manufacturerId + '_' + #vehicleType",
            unless = "#result == null || #result.isEmpty()"
    )
    public List<ModelSeriesDto> getModels(Long manufacturerId, String vehicleType) {
        log.info("Fetching models for manufacturer: {}, type: {}", manufacturerId, vehicleType);
        return umapiClient.getModels(manufacturerId, vehicleType);
    }

    /**
     * Get passenger car modifications by model ID
     * Cached for 24 hours
     */
    @Cacheable(
            cacheNames = "umapi-modifications",
            key = "#modelId + '_P'",
            unless = "#result == null || #result.isEmpty()"
    )
    public List<ModificationDto> getPassengerModifications(Long modelId) {
        log.info("Fetching passenger modifications for model: {}", modelId);
        return umapiClient.getPassengerModifications(modelId);
    }

    /**
     * Get categories by modification ID
     * Cached for 6 hours
     */
    @Cacheable(
            cacheNames = "umapi-categories",
            key = "#modificationId",
            unless = "#result == null || #result.isEmpty()"
    )
    public List<CategoryDto> getCategories(Long modificationId) {
        log.info("Fetching categories for modification: {}", modificationId);
        return umapiClient.getCategories(modificationId);
    }

    /**
     * Get products by category and modification
     * Cached for 1 hour
     */
    @Cacheable(
            cacheNames = "umapi-products",
            key = "#categoryId + '_' + #modificationId",
            unless = "#result == null || #result.isEmpty()"
    )
    public List<ProductDto> getProducts(Long categoryId, Long modificationId) {
        log.info("Fetching products for category: {}, modification: {}", categoryId, modificationId);
        return umapiClient.getProducts(categoryId, modificationId);
    }

    /**
     * Get articles by product and modification
     * Cached for 1 hour
     */
    @Cacheable(
            cacheNames = "umapi-articles",
            key = "#productId + '_' + #modificationId",
            unless = "#result == null || #result.isEmpty()"
    )
    public List<ArticleDto> getArticles(Long productId, Long modificationId) {
        log.info("Fetching articles for product: {}, modification: {}", productId, modificationId);
        return umapiClient.getArticles(productId, modificationId);
    }

    /**
     * Search by article number (brand refinement)
     * Returns list of brands that have this article
     * Cached for 6 hours
     */
    @Cacheable(
            cacheNames = "umapi-brand-search",
            key = "#articleNumber",
            unless = "#result == null || #result.isEmpty()"
    )
    public List<BrandRefinementDto> searchByArticle(String articleNumber) {
        log.info("Searching by article: {}", articleNumber);
        // Normalize article number (remove spaces, dashes)
        String normalized = normalizeArticleNumber(articleNumber);
        return umapiClient.searchByArticle(normalized);
    }

    /**
     * Get analogs by article number and brand
     * Cached for 6 hours
     */
    @Cacheable(
            cacheNames = "umapi-analogs",
            key = "#articleNumber + '_' + #brand",
            unless = "#result == null"
    )
    public List<AnalogDto> getAnalogs(String articleNumber, String brand) {
        log.info("Fetching analogs for article: {}, brand: {}", articleNumber, brand);
        String normalized = normalizeArticleNumber(articleNumber);
        return umapiClient.getAnalogs(normalized, brand);
    }

    /**
     * Normalize article number by removing spaces, dashes, and converting to uppercase
     */
    private String normalizeArticleNumber(String articleNumber) {
        if (articleNumber == null) {
            return null;
        }
        return articleNumber.replaceAll("[\\s-]", "").toUpperCase();
    }
}
