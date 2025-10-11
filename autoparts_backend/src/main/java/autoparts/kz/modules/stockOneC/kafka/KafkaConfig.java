package autoparts.kz.modules.stockOneC.kafka;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(prefix = "integration.kafka", name = "enabled", havingValue = "true")
public class KafkaConfig {

    @Bean
    public NewTopic topicOrderCreated(@Value("${kafka.topics.order-created}") String name) {
        return new NewTopic(name, 3, (short)1);
    }

    @Bean
    public NewTopic topicStockReserved(@Value("${kafka.topics.stock-reserved}") String name) {
        return new NewTopic(name, 3, (short)1);
    }

    @Bean
    public NewTopic topicStockRejected(@Value("${kafka.topics.stock-rejected}") String name) {
        return new NewTopic(name, 3, (short)1);
    }
}
