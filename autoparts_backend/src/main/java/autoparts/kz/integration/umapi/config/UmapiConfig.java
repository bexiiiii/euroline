package autoparts.kz.integration.umapi.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.web.client.RestTemplate;

/**
 * Production-ready UMAPI RestTemplate configuration
 */
@Slf4j
@Configuration
@EnableRetry
@RequiredArgsConstructor
public class UmapiConfig {
    
    private final UmapiProperties umapiProperties;

    @Bean("umapiRestTemplate")
    public RestTemplate umapiRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(umapiProperties.getTimeout().getConnect());
        factory.setReadTimeout(umapiProperties.getTimeout().getRead());
        
        RestTemplate restTemplate = new RestTemplate(factory);
        restTemplate.getInterceptors().add(apiKeyInterceptor());
        
        log.info("UMAPI RestTemplate configured with {} interceptors", restTemplate.getInterceptors().size());
        return restTemplate;
    }

    private ClientHttpRequestInterceptor apiKeyInterceptor() {
        return (request, body, execution) -> {
            String apiKey = umapiProperties.getApiKey();
            
            // Add X-App-Key header
            request.getHeaders().add("X-App-Key", apiKey);
            
            // Detailed logging
            log.info("=== UMAPI Request ===");
            log.info("URL: {}", request.getURI());
            log.info("Method: {}", request.getMethod());
            log.info("Full X-App-Key: {}", apiKey);
            log.info("All Headers: {}", request.getHeaders());
            log.info("====================");
            
            var response = execution.execute(request, body);
            
            log.info("=== UMAPI Response ===");
            log.info("Status: {}", response.getStatusCode());
            log.info("Headers: {}", response.getHeaders());
            log.info("======================");
            
            return response;
        };
    }
}
