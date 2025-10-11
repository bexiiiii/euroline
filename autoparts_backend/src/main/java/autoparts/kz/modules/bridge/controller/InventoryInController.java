package autoparts.kz.modules.bridge.controller;

import autoparts.kz.modules.stockOneC.kafka.InventoryDeltaMsg;
import autoparts.kz.modules.stockOneC.kafka.InventorySnapshotMsg;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/bridge/inventory")
@ConditionalOnProperty(prefix = "integration.kafka", name = "enabled", havingValue = "true")
public class InventoryInController {

    private final KafkaTemplate<String,Object> kafka;
    @Value("${topics.inventory-delta}") String tDelta;
    @Value("${topics.inventory-snapshot}") String tSnap;

    public InventoryInController(@Qualifier("kafkaTemplate") KafkaTemplate<String,Object> kafka) {
        this.kafka = kafka;
    }

    @PostMapping("/delta")
    public void delta(@RequestBody InventoryDeltaMsg msg){
        kafka.send(tDelta, msg.getSku(), msg);
    }

    @PostMapping("/snapshot")
    public void snapshot(@RequestBody InventorySnapshotMsg msg){
        kafka.send(tSnap, msg.getSku(), msg);
    }
}
