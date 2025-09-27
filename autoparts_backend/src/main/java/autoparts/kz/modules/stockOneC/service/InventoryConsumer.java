package autoparts.kz.modules.stockOneC.service;



import autoparts.kz.modules.stockOneC.entity.InventoryOffset;
import autoparts.kz.modules.stockOneC.entity.Stock;
import autoparts.kz.modules.stockOneC.entity.Warehouse;
import autoparts.kz.modules.stockOneC.kafka.InventoryDeltaMsg;
import autoparts.kz.modules.stockOneC.kafka.InventorySnapshotMsg;
import autoparts.kz.modules.stockOneC.repository.InventoryOffsetRepo;
import autoparts.kz.modules.stockOneC.repository.StockRepo;
import autoparts.kz.modules.stockOneC.repository.WarehouseRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.cache.CacheManager;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryConsumer {

    private final WarehouseRepo warehouseRepo;
    private final StockRepo stockRepo;
    private final InventoryOffsetRepo offsetRepo;
    private final CacheManager cacheManager;

    @KafkaListener(topics = "${topics.inventory-delta}", groupId = "inventory-consumers", containerFactory = "listenerFactory")
    @Transactional
    public void onDelta(ConsumerRecord<String, InventoryDeltaMsg> rec, Acknowledgment ack){
        try {
            var msg = rec.value();
            Warehouse wh = warehouseRepo.findByCode(msg.getWarehouseCode())
                    .orElseGet(() -> { var w = new Warehouse(); w.setCode(msg.getWarehouseCode()); return warehouseRepo.save(w); });

            var off = offsetRepo.findBySkuAndWarehouseCode(msg.getSku(), msg.getWarehouseCode())
                    .orElseGet(() -> { var o = new InventoryOffset(); o.setSku(msg.getSku()); o.setWarehouseCode(msg.getWarehouseCode()); o.setLastSequence(-1L); return o; });

            if (msg.getSequence()!=null && msg.getSequence() <= off.getLastSequence()){
                ack.acknowledge(); return;
            }

            Stock s = stockRepo.findBySkuAndWarehouse(msg.getSku(), wh)
                    .orElseGet(() -> { var st = new Stock(); st.setSku(msg.getSku()); st.setWarehouse(wh); return st; });
            int d = Optional.ofNullable(msg.getDelta()).orElse(0);
            s.setAvailableQty(Math.max(0, s.getAvailableQty() + d));
            s.setUpdatedAt(Instant.now());
            stockRepo.save(s);

            if (msg.getSequence()!=null){ off.setLastSequence(msg.getSequence()); offsetRepo.save(off); }

            Optional.ofNullable(cacheManager.getCache("availability")).ifPresent(c -> c.evict(msg.getSku()));
            ack.acknowledge();
        } catch (Exception e){
            log.error("inventory delta error", e); throw e;
        }
    }

    @KafkaListener(topics = "${topics.inventory-snapshot}", groupId = "inventory-consumers", containerFactory = "listenerFactory")
    @Transactional
    public void onSnapshot(ConsumerRecord<String, InventorySnapshotMsg> rec, Acknowledgment ack){
        var msg = rec.value();
        Warehouse wh = warehouseRepo.findByCode(msg.getWarehouseCode())
                .orElseGet(() -> { var w = new Warehouse(); w.setCode(msg.getWarehouseCode()); return warehouseRepo.save(w); });
        Stock s = stockRepo.findBySkuAndWarehouse(msg.getSku(), wh)
                .orElseGet(() -> { var st = new Stock(); st.setSku(msg.getSku()); st.setWarehouse(wh); return st; });
        s.setAvailableQty(Optional.ofNullable(msg.getAvailable()).orElse(0));
        s.setUpdatedAt(Instant.now());
        stockRepo.save(s);
        Optional.ofNullable(cacheManager.getCache("availability")).ifPresent(c -> c.evict(msg.getSku()));
        ack.acknowledge();
    }
}