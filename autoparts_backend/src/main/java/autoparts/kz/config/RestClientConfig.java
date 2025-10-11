package autoparts.kz.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * Конфигурация для REST клиентов
 */
@Configuration
public class RestClientConfig {

    /**
     * REST клиент для интеграции с 1C и других внешних вызовов
     */
    @Bean(name = "oneCRestTemplate")
    public RestTemplate oneCRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000); // 10 секунд
        factory.setReadTimeout(30000);    // 30 секунд
        
        return new RestTemplate(factory);
    }
}
