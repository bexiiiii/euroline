package autoparts.kz.modules.admin.Events.events;


import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
@ConditionalOnProperty(prefix = "integration.kafka", name = "enabled", havingValue = "true")
public class OrderEventProducer {

    private final KafkaTemplate<String, Object> kafka;

    public OrderEventProducer(@Qualifier("kafkaTemplate") KafkaTemplate<String, Object> kafka) {
        this.kafka = kafka;
    }

    public void send(String type, Long orderId, Long userId, String payload) {
        OrderEvent evt = new OrderEvent(type, orderId, userId, payload, Instant.now());
        kafka.send("orders.events", String.valueOf(orderId), evt);
    }
}
