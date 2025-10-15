package autoparts.kz.integration.umapi.client;

import autoparts.kz.integration.umapi.config.UmapiProperties;
import autoparts.kz.integration.umapi.dto.*;
import autoparts.kz.integration.umapi.exception.UmapiApiException;
import autoparts.kz.integration.umapi.exception.UmapiConnectionException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Map;

/**
 * Low-level HTTP client for UMAPI.ru
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UmapiClient {

    @Qualifier("umapiRestTemplate")
    private final RestTemplate restTemplate;

    private final UmapiProperties properties;

    /**
     * Get manufacturers by vehicle type
     */
    @Retryable(
            value = {UmapiConnectionException.class},
            maxAttemptsExpression = "#{${umapi.retry.max-attempts}}",
            backoff = @Backoff(delayExpression = "#{${umapi.retry.backoff-delay}}")
    )
    public List<ManufacturerDto> getManufacturers(String vehicleType) {
        String url = buildUrl("/v2/autocatalog/{locale}/Manufacturers");
        
        try {
            log.debug("Fetching manufacturers for vehicle type: {}", vehicleType);
            
            ResponseEntity<List<ManufacturerDto>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<ManufacturerDto>>() {},
                    Map.of("locale", properties.getLocale()),
                    Map.of("linkingTargetType", vehicleType)
            );
            
            return response.getBody();
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            log.error("UMAPI error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new UmapiApiException("Failed to fetch manufacturers", e.getStatusCode().value(), e);
        } catch (ResourceAccessException e) {
            log.error("Connection to UMAPI failed", e);
            throw new UmapiConnectionException("Failed to connect to UMAPI", e);
        }
    }

    /**
     * Get models by manufacturer ID
     */
    @Retryable(
            value = {UmapiConnectionException.class},
            maxAttemptsExpression = "#{${umapi.retry.max-attempts}}",
            backoff = @Backoff(delayExpression = "#{${umapi.retry.backoff-delay}}")
    )
    public List<ModelSeriesDto> getModels(Long manufacturerId, String vehicleType) {
        String url = buildUrl("/v2/autocatalog/{locale}/ModelSeries?manuId={manuId}&linkingTargetType={vehicleType}");
        
        try {
            log.debug("Fetching models for manufacturer: {}, type: {}", manufacturerId, vehicleType);
            
            ResponseEntity<List<ModelSeriesDto>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<ModelSeriesDto>>() {},
                    Map.of(
                            "locale", properties.getLocale(),
                            "manuId", manufacturerId,
                            "vehicleType", vehicleType
                    )
            );
            
            return response.getBody();
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            log.error("UMAPI error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new UmapiApiException("Failed to fetch models", e.getStatusCode().value(), e);
        } catch (ResourceAccessException e) {
            log.error("Connection to UMAPI failed", e);
            throw new UmapiConnectionException("Failed to connect to UMAPI", e);
        }
    }

    /**
     * Get passenger car modifications by model ID
     */
    @Retryable(
            value = {UmapiConnectionException.class},
            maxAttemptsExpression = "#{${umapi.retry.max-attempts}}",
            backoff = @Backoff(delayExpression = "#{${umapi.retry.backoff-delay}}")
    )
    public List<ModificationDto> getPassengerModifications(Long modelId) {
        String url = buildUrl("/v2/autocatalog/{locale}/Passangers?modelId={modelId}");
        
        try {
            log.debug("Fetching passenger modifications for model: {}", modelId);
            
            ResponseEntity<List<ModificationDto>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<ModificationDto>>() {},
                    Map.of(
                            "locale", properties.getLocale(),
                            "modelId", modelId
                    )
            );
            
            return response.getBody();
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            log.error("UMAPI error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new UmapiApiException("Failed to fetch modifications", e.getStatusCode().value(), e);
        } catch (ResourceAccessException e) {
            log.error("Connection to UMAPI failed", e);
            throw new UmapiConnectionException("Failed to connect to UMAPI", e);
        }
    }

    /**
     * Get categories by modification ID
     */
    @Retryable(
            value = {UmapiConnectionException.class},
            maxAttemptsExpression = "#{${umapi.retry.max-attempts}}",
            backoff = @Backoff(delayExpression = "#{${umapi.retry.backoff-delay}}")
    )
    public List<CategoryDto> getCategories(Long modificationId) {
        String url = buildUrl("/v2/autocatalog/{locale}/Categories?carId={carId}");
        
        try {
            log.debug("Fetching categories for modification: {}", modificationId);
            
            ResponseEntity<List<CategoryDto>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<CategoryDto>>() {},
                    Map.of(
                            "locale", properties.getLocale(),
                            "carId", modificationId
                    )
            );
            
            return response.getBody();
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            log.error("UMAPI error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new UmapiApiException("Failed to fetch categories", e.getStatusCode().value(), e);
        } catch (ResourceAccessException e) {
            log.error("Connection to UMAPI failed", e);
            throw new UmapiConnectionException("Failed to connect to UMAPI", e);
        }
    }

    /**
     * Get products by category and modification
     */
    @Retryable(
            value = {UmapiConnectionException.class},
            maxAttemptsExpression = "#{${umapi.retry.max-attempts}}",
            backoff = @Backoff(delayExpression = "#{${umapi.retry.backoff-delay}}")
    )
    public List<ProductDto> getProducts(Long categoryId, Long modificationId) {
        String url = buildUrl("/v2/autocatalog/{locale}/Products?categoryId={categoryId}&carId={carId}");
        
        try {
            log.debug("Fetching products for category: {}, modification: {}", categoryId, modificationId);
            
            ResponseEntity<List<ProductDto>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<ProductDto>>() {},
                    Map.of(
                            "locale", properties.getLocale(),
                            "categoryId", categoryId,
                            "carId", modificationId
                    )
            );
            
            return response.getBody();
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            log.error("UMAPI error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new UmapiApiException("Failed to fetch products", e.getStatusCode().value(), e);
        } catch (ResourceAccessException e) {
            log.error("Connection to UMAPI failed", e);
            throw new UmapiConnectionException("Failed to connect to UMAPI", e);
        }
    }

    /**
     * Get articles by product and modification
     */
    @Retryable(
            value = {UmapiConnectionException.class},
            maxAttemptsExpression = "#{${umapi.retry.max-attempts}}",
            backoff = @Backoff(delayExpression = "#{${umapi.retry.backoff-delay}}")
    )
    public List<ArticleDto> getArticles(Long productId, Long modificationId) {
        String url = buildUrl("/v2/autocatalog/{locale}/Articles?productId={productId}&carId={carId}");
        
        try {
            log.debug("Fetching articles for product: {}, modification: {}", productId, modificationId);
            
            ResponseEntity<List<ArticleDto>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<ArticleDto>>() {},
                    Map.of(
                            "locale", properties.getLocale(),
                            "productId", productId,
                            "carId", modificationId
                    )
            );
            
            return response.getBody();
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            log.error("UMAPI error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new UmapiApiException("Failed to fetch articles", e.getStatusCode().value(), e);
        } catch (ResourceAccessException e) {
            log.error("Connection to UMAPI failed", e);
            throw new UmapiConnectionException("Failed to connect to UMAPI", e);
        }
    }

    /**
     * Search articles by article number (brand refinement)
     */
    @Retryable(
            value = {UmapiConnectionException.class},
            maxAttemptsExpression = "#{${umapi.retry.max-attempts}}",
            backoff = @Backoff(delayExpression = "#{${umapi.retry.backoff-delay}}")
    )
    public BrandRefinementDto searchByArticle(String articleNumber) {
        String url = buildUrl("/v2/autocatalog/{locale}/BrandRefinement/{article}");
        
        try {
            log.debug("Searching by article: {}", articleNumber);
            
            ResponseEntity<BrandRefinementDto> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    BrandRefinementDto.class,
                    Map.of(
                            "locale", properties.getLocale(),
                            "article", articleNumber
                    )
            );
            
            return response.getBody();
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            log.error("UMAPI error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new UmapiApiException("Failed to search by article", e.getStatusCode().value(), e);
        } catch (ResourceAccessException e) {
            log.error("Connection to UMAPI failed", e);
            throw new UmapiConnectionException("Failed to connect to UMAPI", e);
        }
    }

    /**
     * Get analogs by article number and brand
     */
    @Retryable(
            value = {UmapiConnectionException.class},
            maxAttemptsExpression = "#{${umapi.retry.max-attempts}}",
            backoff = @Backoff(delayExpression = "#{${umapi.retry.backoff-delay}}")
    )
    public AnalogDto getAnalogs(String articleNumber, String brand) {
        String url = buildUrl("/v2/cross/{locale}/Analogs/{article}/{brand}");
        
        try {
            log.debug("Fetching analogs for article: {}, brand: {}", articleNumber, brand);
            
            ResponseEntity<AnalogDto> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    AnalogDto.class,
                    Map.of(
                            "locale", properties.getLocale(),
                            "article", articleNumber,
                            "brand", brand
                    )
            );
            
            return response.getBody();
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            log.error("UMAPI error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new UmapiApiException("Failed to fetch analogs", e.getStatusCode().value(), e);
        } catch (ResourceAccessException e) {
            log.error("Connection to UMAPI failed", e);
            throw new UmapiConnectionException("Failed to connect to UMAPI", e);
        }
    }

    private String buildUrl(String path) {
        return UriComponentsBuilder.fromUriString(properties.getBaseUrl())
                .path(path)
                .toUriString();
    }
}
