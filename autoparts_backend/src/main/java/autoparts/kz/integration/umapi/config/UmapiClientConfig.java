package autoparts.kz.integration.umapi.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * Configuration for UMAPI REST client
 */
@Configuration
@EnableRetry
@RequiredArgsConstructor
public class UmapiClientConfig {

    private final UmapiProperties umapiProperties;

    /**
     * RestTemplate bean for UMAPI.ru API calls
     */
    @Bean("umapiRestTemplate")
    public RestTemplate umapiRestTemplate(RestTemplateBuilder builder) {
        return builder
                .rootUri(umapiProperties.getBaseUrl())
                .setConnectTimeout(Duration.ofMillis(umapiProperties.getTimeout().getConnect()))
                .setReadTimeout(Duration.ofMillis(umapiProperties.getTimeout().getRead()))
                .additionalInterceptors(apiKeyInterceptor())
                .build();
    }

    /**
     * Interceptor to add API key to all requests
     */
    private ClientHttpRequestInterceptor apiKeyInterceptor() {
        return (request, body, execution) -> {
            request.getHeaders().add("Authorization", "Bearer " + umapiProperties.getApiKey());
            return execution.execute(request, body);
        };
    }
}
