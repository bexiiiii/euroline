package autoparts.kz.modules.stockOneC.service;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.requestreply.ReplyingKafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryOnDemandRefresher {
    private final ObjectProvider<ReplyingKafkaTemplate<String, Object, Object>> kafkaTemplateProvider;

    @Value("${topics.inventory-query-request:}")
    String reqTopic;

    public void refreshSkus(List<String> skus){
        ReplyingKafkaTemplate<String, Object, Object> template = kafkaTemplateProvider.getIfAvailable();
        if (template == null || reqTopic == null || reqTopic.isBlank()) {
            log.debug("Inventory refresh skipped: Kafka integration disabled. Requested SKUs: {}", skus);
            return;
        }
        try {
            var payload = Map.of("skus", skus);
            var record = new ProducerRecord<String,Object>(reqTopic, "refresh", payload);
            template.sendAndReceive(record).get();
        } catch (Exception e) {
            log.warn("Inventory refresh request failed: {}", e.getMessage());
        }
    }
}
