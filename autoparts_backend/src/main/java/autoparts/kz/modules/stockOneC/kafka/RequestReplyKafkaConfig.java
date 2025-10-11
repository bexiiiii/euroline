
package autoparts.kz.modules.stockOneC.kafka;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.*;
import org.springframework.kafka.listener.ContainerProperties;
import org.springframework.kafka.requestreply.ReplyingKafkaTemplate;
import java.util.*;

@Configuration
@ConditionalOnProperty(prefix = "integration.kafka", name = "enabled", havingValue = "true")
public class RequestReplyKafkaConfig {

    @Value("${kafka.bootstrap-servers}") String bootstrap;
    @Value("${topics.inventory-query-reply}") String replyTopic;

    @Bean
    public ReplyingKafkaTemplate<String, Object, Object> replyingKafkaTemplate(
            ProducerFactory<String, Object> pf,
            ConcurrentKafkaListenerContainerFactory<String, Object> replyFactory) {
        var container = replyFactory.createContainer(replyTopic);
        container.getContainerProperties().setGroupId("inventory-query-client-replies");
        container.getContainerProperties().setAckMode(ContainerProperties.AckMode.BATCH);
        return new ReplyingKafkaTemplate<>(pf, container);
    }
}
