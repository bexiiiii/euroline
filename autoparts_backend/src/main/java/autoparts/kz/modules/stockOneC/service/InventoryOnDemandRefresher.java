package autoparts.kz.modules.stockOneC.service;


import lombok.RequiredArgsConstructor;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.requestreply.ReplyingKafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryOnDemandRefresher {
    private final ReplyingKafkaTemplate<String, Object, Object> rr;

    @Value("${topics.inventory-query-request}") String reqTopic;

    public void refreshSkus(List<String> skus){
        try {
            var record = new ProducerRecord<String,Object>(reqTopic, "refresh", java.util.Map.of("skus", skus));
            rr.sendAndReceive(record).get(); // ждём ответ — если 1С не подключена, просто истечёт таймаут
        } catch (Exception ignored) {}
    }
}