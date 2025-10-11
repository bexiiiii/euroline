package autoparts.kz.modules.bridge.service;



import autoparts.kz.modules.stockOneC.kafka.OrderRequestMsg;
import lombok.RequiredArgsConstructor;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.*;

@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "integration.kafka", name = "enabled", havingValue = "true")
public class OrderRequestBuffer {

    private final BlockingQueue<ConsumerRecord<String, OrderRequestMsg>> queue = new LinkedBlockingQueue<>();

    @KafkaListener(topics="${topics.order-request}", groupId="onec-bridge-poller", containerFactory="listenerFactory")
    public void onOrder(ConsumerRecord<String,OrderRequestMsg> rec){
        queue.offer(rec);
    }

    public List<Map<String,Object>> poll(int max, long waitMs){
        var list = new ArrayList<Map<String,Object>>();
        try {
            var first = queue.poll(waitMs, TimeUnit.MILLISECONDS);
            if (first != null){
                list.add(Map.of("key", first.key(), "value", first.value()));
                while (list.size() < max){
                    var next = queue.poll();
                    if (next == null) break;
                    list.add(Map.of("key", next.key(), "value", next.value()));
                }
            }
        } catch (InterruptedException ignored){}
        return list;
    }
}
