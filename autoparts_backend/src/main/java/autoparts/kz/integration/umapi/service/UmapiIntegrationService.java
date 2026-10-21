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
    @Cacheable(cacheNames = "umapi-manufacturers", key = "'PC'", unless = "#result == null || #result.isEmpty()")
    public List<ManufacturerDto> getPassengerManufacturers() {
        log.info("Fetching passenger car manufacturers from UMAPI");
        return umapiClient.getManufacturers(TYPE_PASSENGER);
    }

    /**
     * Get all manufacturers for commercial vehicles
     * Cached for 24 hours
     */
    @Cacheable(cacheNames = "umapi-manufacturers", key = "'CV'", unless = "#result == null || #result.isEmpty()")
    public List<ManufacturerDto> getCommercialManufacturers() {
        log.info("Fetching commercial vehicle manufacturers from UMAPI");
        return umapiClient.getManufacturers(TYPE_COMMERCIAL);
    }

    /**
     * Get all manufacturers for motorbikes
     * Cached for 24 hours
     */
    @Cacheable(cacheNames = "umapi-manufacturers", key = "'Motorcycle'", unless = "#result == null || #result.isEmpty()")
    public List<ManufacturerDto> getMotorbikeManufacturers() {
        log.info("Fetching motorbike manufacturers from UMAPI");
        return umapiClient.getManufacturers(TYPE_MOTORBIKE);
    }

    /**
     * Get models by manufacturer ID and vehicle type (P/C/M or UMAPI PC/CV/Motorcycle)
     * Cached for 24 hours
     */
    @Cacheable(
            cacheNames = "umapi-models",
            key = "#manufacturerId + '_' + T(autoparts.kz.integration.umapi.service.UmapiIntegrationService).toUmapiType(#vehicleType)",
            unless = "#result == null || #result.isEmpty()"
    )
    public List<ModelSeriesDto> getModels(Long manufacturerId, String vehicleType) {
        log.info("Fetching models for manufacturer: {}, type: {}", manufacturerId, vehicleType);
        return umapiClient.getModels(manufacturerId, toUmapiType(vehicleType));
    }

    /**
     * Get modifications by model series ID; endpoint depends on vehicle type
     * (Passangers / CommercialVehicles / Motorbikes)
     * Cached for 24 hours
     */
    @Cacheable(
            cacheNames = "umapi-modifications",
            key = "#modelId + '_' + T(autoparts.kz.integration.umapi.service.UmapiIntegrationService).toUmapiType(#vehicleType)",
            unless = "#result == null || #result.isEmpty()"
    )
    public List<ModificationDto> getModifications(Long modelId, String vehicleType) {
        String type = toUmapiType(vehicleType);
        log.info("Fetching modifications for model: {}, type: {}", modelId, type);
        return switch (type) {
            case TYPE_COMMERCIAL -> umapiClient.getCommercialModifications(modelId);
            case TYPE_MOTORBIKE -> umapiClient.getMotorbikeModifications(modelId);
            default -> umapiClient.getPassengerModifications(modelId);
        };
    }

    /**
     * Get category tree for a modification
     * Cached for 6 hours
     */
    @Cacheable(
            cacheNames = "umapi-categories",
            key = "#modificationId + '_' + T(autoparts.kz.integration.umapi.service.UmapiIntegrationService).toUmapiType(#vehicleType)",
            unless = "#result == null || #result.isEmpty()"
    )
    public List<CategoryDto> getCategories(Long modificationId, String vehicleType) {
        log.info("Fetching categories for modification: {}, type: {}", modificationId, vehicleType);
        return umapiClient.getCategories(modificationId, toUmapiType(vehicleType));
    }

    /**
     * Get products by category and modification
     * Cached for 1 hour
     */
    @Cacheable(
            cacheNames = "umapi-products",
            key = "#categoryId + '_' + #modificationId + '_' + T(autoparts.kz.integration.umapi.service.UmapiIntegrationService).toUmapiType(#vehicleType)",
            unless = "#result == null || #result.isEmpty()"
    )
    public List<ProductDto> getProducts(Long categoryId, Long modificationId, String vehicleType) {
        log.info("Fetching products for category: {}, modification: {}, type: {}", categoryId, modificationId, vehicleType);
        return umapiClient.getProducts(categoryId, modificationId, toUmapiType(vehicleType));
    }

    /**
     * Get articles page by product (PT_ID) and modification, optionally for one supplier
     * Cached for 1 hour
     */
    @Cacheable(
            cacheNames = "umapi-articles",
            key = "#productId + '_' + #modificationId + '_' + T(autoparts.kz.integration.umapi.service.UmapiIntegrationService).toUmapiType(#vehicleType)"
                    + " + '_' + #supplierId + '_' + #limit + '_' + #offset",
            unless = "#result == null || #result.data == null || #result.data.isEmpty()"
    )
    public ArticlesPageDto getArticles(Long productId, Long modificationId, String vehicleType,
                                       Long supplierId, int limit, long offset) {
        log.info("Fetching articles for product: {}, modification: {}, type: {}, supplier: {}",
                productId, modificationId, vehicleType, supplierId);
        int safeLimit = Math.max(1, Math.min(limit, 100));
        long safeOffset = Math.max(0, offset);
        return umapiClient.getArticles(productId, modificationId, toUmapiType(vehicleType),
                supplierId, safeLimit, safeOffset);
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
        List<BrandRefinementDto> found = umapiClient.searchByArticle(normalized);
        // ArrayList, а не List.of()/toList(): Redis-кэш хранит тип коллекции и не читает неизменяемые списки
        if (found == null) return new java.util.ArrayList<>();
        // UMAPI добавляет нечёткие совпадения (артикул «16» на запрос «20424109») — оставляем точные
        String key = articleKey(normalized);
        return found.stream()
                .filter(b -> key.equals(articleKey(b.getArticleSearch())) || key.equals(articleKey(b.getArticle())))
                .collect(java.util.stream.Collectors.toCollection(java.util.ArrayList::new));
    }

    private static String articleKey(String article) {
        return article == null ? "" : article.toUpperCase().replaceAll("[^A-Z0-9А-ЯЁ]", "");
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

    static final String TYPE_PASSENGER = "PC";
    static final String TYPE_COMMERCIAL = "CV";
    static final String TYPE_MOTORBIKE = "Motorcycle";

    /**
     * Map our vehicle type (P/C/M, legacy UMAPI linkingTargetType) to UMAPI v2 "type".
     * Already-UMAPI values (PC/CV/Motorcycle) pass through; null defaults to PC.
     */
    public static String toUmapiType(String vehicleType) {
        if (vehicleType == null || vehicleType.isBlank()) {
            return TYPE_PASSENGER;
        }
        return switch (vehicleType.trim().toUpperCase()) {
            case "P", "PC" -> TYPE_PASSENGER;
            case "C", "CV" -> TYPE_COMMERCIAL;
            case "M", "MOTORCYCLE" -> TYPE_MOTORBIKE;
            default -> throw new IllegalArgumentException(
                    "Unsupported vehicleType: " + vehicleType + " (expected P, C or M)");
        };
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
