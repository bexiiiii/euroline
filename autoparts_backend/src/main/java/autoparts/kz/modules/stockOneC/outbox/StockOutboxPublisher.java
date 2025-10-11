package autoparts.kz.modules.stockOneC.outbox;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "integration.kafka", name = "enabled", havingValue = "true")
public class StockOutboxPublisher {

    private final OutboxRepository outboxRepository;
    private final KafkaTemplate<String, String> kafka;
    private final ObjectMapper om;

    @Value("${kafka.topics.order-created}")
    private String topicOrderCreated;

    @Scheduled(fixedDelayString = "${outbox.publisher.delay-ms:1000}")
    @Transactional
    public void publish() {
        List<OutboxMessage> batch = outboxRepository
                .findTop100ByStatusOrderByCreatedAtAsc(OutboxMessage.Status.NEW);
        for (OutboxMessage msg : batch) {
            try {
                String topic = resolveTopic(msg.getEventType());
                kafka.send(topic, msg.getPayloadJson()).get();
                msg.setStatus(OutboxMessage.Status.SENT);
                outboxRepository.save(msg);
            } catch (Exception e) {
                log.error("Outbox publish failed id={}, err={}", msg.getId(), e.getMessage(), e);
                msg.setStatus(OutboxMessage.Status.FAILED);
                outboxRepository.save(msg);
            }
        }
    }

    private String resolveTopic(String eventType) {
        if ("OrderCreated".equals(eventType)) return topicOrderCreated;
        throw new IllegalArgumentException("Unknown eventType: " + eventType);
    }
}
