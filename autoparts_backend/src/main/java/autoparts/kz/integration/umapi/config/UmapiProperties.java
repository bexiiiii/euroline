package autoparts.kz.integration.umapi.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for UMAPI.ru integration
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "umapi")
public class UmapiProperties {
    /**
     * Base URL for UMAPI
     */
    private String baseUrl;
    /**
     * Locale string, e.g. "ru-RU"
     */
    private String locale = "ru-RU";
    /**
     * API key for authorization
     */
    private String apiKey;
    /**
     * Retry settings
     */
    private Retry retry = new Retry();
    /**
     * Timeout settings
     */
    private Timeout timeout = new Timeout();

    @Data
    public static class Retry {
        private int maxAttempts = 3;
        private long backoffDelay = 1000;
    }

    @Data
    public static class Timeout {
        private int connect = 5000;
        private int read = 10000;
    }
}
