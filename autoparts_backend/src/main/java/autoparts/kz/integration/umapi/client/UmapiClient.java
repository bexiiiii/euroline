package autoparts.kz.integration.umapi.client;

import autoparts.kz.integration.umapi.config.UmapiProperties;
import autoparts.kz.integration.umapi.dto.*;
import autoparts.kz.integration.umapi.exception.UmapiApiException;
import autoparts.kz.integration.umapi.exception.UmapiConnectionException;
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

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Low-level HTTP client for UMAPI.ru
 */
@Slf4j
@Component
public class UmapiClient {

    // Dedicated reads for automatic OE discovery. No recursive analog expansion.
    public com.fasterxml.jackson.databind.JsonNode getCrossArticleInfo(String article, String brand) {
        return restTemplate.getForObject(buildUrl("/v2/cross/parts/Analogs/getCrossInfo?article={article}&brand={brand}"),
                com.fasterxml.jackson.databind.JsonNode.class, Map.of("article", article, "brand", brand));
    }

    public com.fasterxml.jackson.databind.JsonNode getArticleDetails(long id) {
        return getAutocatalog("/Article/{id}", Map.of("id", id),
                new ParameterizedTypeReference<com.fasterxml.jackson.databind.JsonNode>() {}, "Failed to fetch article details");
    }

    public com.fasterxml.jackson.databind.JsonNode getOeCandidates(String number, int offset) {
        return getAutocatalog("/Analogs/{number}?OENumber=true&ArticleNumber=false&TradeNumber=false&EAN=false&IAMNumber=false&limit=100&offset={offset}&Products=true&Criterias=true",
                Map.of("number", number, "offset", offset),
                new ParameterizedTypeReference<com.fasterxml.jackson.databind.JsonNode>() {}, "Failed to fetch OE candidates");
    }

    private final RestTemplate restTemplate;
    private final UmapiProperties properties;

    // Явный конструктор с @Qualifier для правильного внедрения бина
    public UmapiClient(@Qualifier("umapiRestTemplate") RestTemplate restTemplate, 
                       UmapiProperties properties) {
        this.restTemplate = restTemplate;
        this.properties = properties;
    }

    // Autocatalog (v2): параметры запроса по актуальному swagger UMAPI
    // (type=PC|CV|Motorcycle..., MFA_ID, MS_ID, ID, CATEGORY_ID, PT_IDS).
    // Значения type уже в формате UMAPI — маппинг P/C/M делает UmapiIntegrationService.

    /**
     * Get manufacturers by UMAPI vehicle type (PC, CV, Motorcycle)
     */
    @Retryable(
            value = {UmapiConnectionException.class},
            maxAttemptsExpression = "#{${umapi.retry.max-attempts}}",
            backoff = @Backoff(delayExpression = "#{${umapi.retry.backoff-delay}}")
    )
    public List<ManufacturerDto> getManufacturers(String type) {
        log.debug("Fetching manufacturers for type: {}", type);
        return getAutocatalog(
                "/Manufacturers?type={type}",
                Map.of("type", type),
                new ParameterizedTypeReference<List<ManufacturerDto>>() {},
                "Failed to fetch manufacturers"
        );
    }

    /**
     * Get model series by manufacturer ID (MFA_ID)
     */
    @Retryable(
            value = {UmapiConnectionException.class},
            maxAttemptsExpression = "#{${umapi.retry.max-attempts}}",
            backoff = @Backoff(delayExpression = "#{${umapi.retry.backoff-delay}}")
    )
    public List<ModelSeriesDto> getModels(Long manufacturerId, String type) {
        log.debug("Fetching models for manufacturer: {}, type: {}", manufacturerId, type);
        return getAutocatalog(
                "/ModelSeries?type={type}&MFA_ID={mfaId}",
                Map.of("type", type, "mfaId", manufacturerId),
                new ParameterizedTypeReference<List<ModelSeriesDto>>() {},
                "Failed to fetch models"
        );
    }

    /**
     * Get passenger car modifications by model series ID (MS_ID)
     */
    @Retryable(
            value = {UmapiConnectionException.class},
            maxAttemptsExpression = "#{${umapi.retry.max-attempts}}",
            backoff = @Backoff(delayExpression = "#{${umapi.retry.backoff-delay}}")
    )
    public List<ModificationDto> getPassengerModifications(Long modelId) {
        log.debug("Fetching passenger modifications for model: {}", modelId);
        return getAutocatalog(
                "/Passangers?type=PC&MS_ID={msId}",
                Map.of("msId", modelId),
                new ParameterizedTypeReference<List<ModificationDto>>() {},
                "Failed to fetch modifications"
        );
    }

    /**
     * Get commercial vehicle modifications by model series ID (MS_ID)
     */
    @Retryable(
            value = {UmapiConnectionException.class},
            maxAttemptsExpression = "#{${umapi.retry.max-attempts}}",
            backoff = @Backoff(delayExpression = "#{${umapi.retry.backoff-delay}}")
    )
    public List<ModificationDto> getCommercialModifications(Long modelId) {
        log.debug("Fetching commercial modifications for model: {}", modelId);
        return getAutocatalog(
                "/CommercialVehicles?type=CV&MS_ID={msId}",
                Map.of("msId", modelId),
                new ParameterizedTypeReference<List<ModificationDto>>() {},
                "Failed to fetch modifications"
        );
    }

    /**
     * Get motorbike modifications by model series ID (MS_ID)
     */
    @Retryable(
            value = {UmapiConnectionException.class},
            maxAttemptsExpression = "#{${umapi.retry.max-attempts}}",
            backoff = @Backoff(delayExpression = "#{${umapi.retry.backoff-delay}}")
    )
    public List<ModificationDto> getMotorbikeModifications(Long modelId) {
        log.debug("Fetching motorbike modifications for model: {}", modelId);
        return getAutocatalog(
                "/Motorbikes?type=Motorcycle&MS_ID={msId}",
                Map.of("msId", modelId),
                new ParameterizedTypeReference<List<ModificationDto>>() {},
                "Failed to fetch modifications"
        );
    }

    /**
     * Get category tree for a modification (ID = PC_ID / CV_ID / MTB_ID)
     */
    @Retryable(
            value = {UmapiConnectionException.class},
            maxAttemptsExpression = "#{${umapi.retry.max-attempts}}",
            backoff = @Backoff(delayExpression = "#{${umapi.retry.backoff-delay}}")
    )
    public List<CategoryDto> getCategories(Long modificationId, String type) {
        log.debug("Fetching categories for modification: {}, type: {}", modificationId, type);
        UmapiCategoriesResponse body = getAutocatalog(
                "/Categories?type={type}&ID={id}",
                Map.of("type", type, "id", modificationId),
                new ParameterizedTypeReference<UmapiCategoriesResponse>() {},
                "Failed to fetch categories"
        );
        return body == null || body.getRoot() == null ? List.of() : body.getRoot();
    }

    /**
     * Get products by category and modification
     */
    @Retryable(
            value = {UmapiConnectionException.class},
            maxAttemptsExpression = "#{${umapi.retry.max-attempts}}",
            backoff = @Backoff(delayExpression = "#{${umapi.retry.backoff-delay}}")
    )
    public List<ProductDto> getProducts(Long categoryId, Long modificationId, String type) {
        log.debug("Fetching products for category: {}, modification: {}, type: {}", categoryId, modificationId, type);
        return getAutocatalog(
                "/Products?type={type}&CATEGORY_ID={categoryId}&ID={id}",
                Map.of("type", type, "categoryId", categoryId, "id", modificationId),
                new ParameterizedTypeReference<List<ProductDto>>() {},
                "Failed to fetch products"
        );
    }

    /**
     * Get articles by product (PT_ID) and modification, optionally for one supplier (SUP_ID).
     * limit: 1..100 (UMAPI).
     */
    @Retryable(
            value = {UmapiConnectionException.class},
            maxAttemptsExpression = "#{${umapi.retry.max-attempts}}",
            backoff = @Backoff(delayExpression = "#{${umapi.retry.backoff-delay}}")
    )
    public ArticlesPageDto getArticles(Long productId, Long modificationId, String type,
                                       Long supplierId, int limit, long offset) {
        log.debug("Fetching articles for product: {}, modification: {}, type: {}, supplier: {}",
                productId, modificationId, type, supplierId);
        Map<String, Object> vars = new HashMap<>();
        vars.put("type", type);
        vars.put("ptIds", productId);
        vars.put("id", modificationId);
        vars.put("limit", limit);
        vars.put("offset", offset);
        String query = "/Articles?type={type}&PT_IDS={ptIds}&ID={id}&limit={limit}&offset={offset}";
        if (supplierId != null) {
            query += "&SUP_ID={supId}";
            vars.put("supId", supplierId);
        }
        return getAutocatalog(
                query,
                vars,
                new ParameterizedTypeReference<ArticlesPageDto>() {},
                "Failed to fetch articles"
        );
    }

    private <T> T getAutocatalog(String pathAndQuery, Map<String, ?> vars,
                                 ParameterizedTypeReference<T> type, String errorMessage) {
        String url = buildUrl("/v2/autocatalog/{locale}" + pathAndQuery);
        Map<String, Object> allVars = new HashMap<>(vars);
        allVars.put("locale", properties.getLocale());
        try {
            return restTemplate.exchange(url, HttpMethod.GET, null, type, allVars).getBody();
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            log.error("UMAPI error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new UmapiApiException(errorMessage, e.getStatusCode().value(), e);
        } catch (ResourceAccessException e) {
            log.error("Connection to UMAPI failed", e);
            throw new UmapiConnectionException("Failed to connect to UMAPI", e);
        }
    }

    /**
     * Search articles by article number (brand refinement)
     * Returns list of brands that have this article
     */
    @Retryable(
            value = {UmapiConnectionException.class},
            maxAttemptsExpression = "#{${umapi.retry.max-attempts}}",
            backoff = @Backoff(delayExpression = "#{${umapi.retry.backoff-delay}}")
    )
    public List<BrandRefinementDto> searchByArticle(String articleNumber) {
        String url = buildUrl("/v2/cross/{locale}/BrandRefinement/{article}");
        
        try {
            log.info("Searching by article: {}", articleNumber);
            log.info("URL template: {}", url);
            log.info("Locale: {}", properties.getLocale());
            log.info("Article parameter: {}", articleNumber);
            
            ResponseEntity<List<BrandRefinementDto>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<BrandRefinementDto>>() {},
                    Map.of(
                            "locale", properties.getLocale(),
                            "article", articleNumber
                    )
            );
            
            log.info("Successfully received {} brand matches for article: {}", 
                     response.getBody() != null ? response.getBody().size() : 0, articleNumber);
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
    public List<AnalogDto> getAnalogs(String articleNumber, String brand) {
        String url = buildUrl("/v2/cross/{locale}/Analogs/{article}/{brand}");
        
        try {
            log.info("Fetching analogs for article: {}, brand: {}", articleNumber, brand);
            log.info("URL template: {}", url);
            log.info("Locale: {}", properties.getLocale());
            
            ResponseEntity<List<AnalogDto>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<AnalogDto>>() {},
                    Map.of(
                            "locale", properties.getLocale(),
                            "article", articleNumber,
                            "brand", brand
                    )
            );
            
            log.info("Successfully received {} analog articles for article: {}, brand: {}", 
                     response.getBody() != null ? response.getBody().size() : 0, articleNumber, brand);
            return response.getBody();
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            log.error("UMAPI error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new UmapiApiException("Failed to fetch analogs", e.getStatusCode().value(), e);
        } catch (ResourceAccessException e) {
            log.error("Connection to UMAPI failed", e);
            throw new UmapiConnectionException("Failed to connect to UMAPI", e);
        }
    }

    // Шаблон URL с {переменными}; RestTemplate сам подставит и закодирует их.
    // UriComponentsBuilder.path() здесь не подходит: он отбрасывает "?query" из шаблона.
    private String buildUrl(String pathTemplate) {
        String base = properties.getBaseUrl();
        if (base.endsWith("/")) base = base.substring(0, base.length() - 1);
        return base + (pathTemplate.startsWith("/") ? pathTemplate : "/" + pathTemplate);
    }
}
