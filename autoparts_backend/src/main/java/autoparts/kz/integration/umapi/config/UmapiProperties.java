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
     * Base URL of UMAPI.ru API
     */
    private String baseUrl = "https://api.umapi.ru";

    /**
     * API key for authentication
     */
    private String apiKey;

    /**
     * Default language code (e.g., "ru", "en")
     */
    private String defaultLanguage = "ru";

    /**
     * Default region code (e.g., "RU", "EU")
     */
    private String defaultRegion = "RU";

    /**
     * HTTP timeout settings
     */
    private Timeout timeout = new Timeout();

    /**
     * Retry settings
     */
    private Retry retry = new Retry();

    @Data
    public static class Timeout {
        /**
         * Connection timeout in milliseconds
         */
        private int connect = 5000;

        /**
         * Read timeout in milliseconds
         */
        private int read = 10000;
    }

    @Data
    public static class Retry {
        /**
         * Maximum number of retry attempts
         */
        private int maxAttempts = 3;

        /**
         * Backoff delay between retries in milliseconds
         */
        private long backoffDelay = 1000;
    }

    /**
     * Get locale string in format "languageCode-regionCode"
     */
    public String getLocale() {
        return defaultLanguage + "-" + defaultRegion;
    }
}
