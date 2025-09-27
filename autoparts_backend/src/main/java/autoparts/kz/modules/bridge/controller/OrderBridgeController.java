package autoparts.kz.modules.bridge.controller;

import autoparts.kz.modules.bridge.service.OrderRequestBuffer;
import autoparts.kz.modules.stockOneC.kafka.OrderResponseMsg;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController @RequestMapping("/bridge/orders")
public class OrderBridgeController {

    private final OrderRequestBuffer buffer;
    private final KafkaTemplate<String,Object> kafka;
    @Value("${topics.order-response}") String tResp;

    public OrderBridgeController(OrderRequestBuffer buffer, 
                                @Qualifier("kafkaTemplate") KafkaTemplate<String,Object> kafka) {
        this.buffer = buffer;
        this.kafka = kafka;
    }

    @GetMapping("/requests/poll")
    public List<Map<String,Object>> poll(@RequestParam(defaultValue="50") int max,
                                         @RequestParam(defaultValue="15000") long waitMs){
        return buffer.poll(max, waitMs);
    }

    @PostMapping("/response")
    public void response(@RequestBody OrderResponseMsg msg){
        kafka.send(tResp, msg.getOrderId(), msg);
    }
}
