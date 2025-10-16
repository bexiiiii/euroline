package autoparts.kz.modules.cml.queue.consumers;

import autoparts.kz.modules.cml.domain.dto.ExchangeJob;
import autoparts.kz.modules.cml.service.OrdersExportService;
import autoparts.kz.modules.cml.util.IdempotencyGuard;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class OrdersExportConsumer {

    private static final Logger log = LoggerFactory.getLogger(OrdersExportConsumer.class);

    private final OrdersExportService ordersExportService;
    private final IdempotencyGuard idempotencyGuard;

    public OrdersExportConsumer(OrdersExportService ordersExportService, IdempotencyGuard idempotencyGuard) {
        this.ordersExportService = ordersExportService;
        this.idempotencyGuard = idempotencyGuard;
        
        // 🔥 КРИТИЧЕСКИ ВАЖНО: Этот лог ОБЯЗАТЕЛЬНО должен появиться!
        log.error("🚀🚀🚀 OrdersExportConsumer BEAN CREATED! 🚀🚀🚀");
        System.out.println("🚀🚀🚀 OrdersExportConsumer BEAN CREATED! 🚀🚀🚀");
        System.err.println("🚀🚀🚀 OrdersExportConsumer BEAN CREATED! 🚀🚀🚀");
    }

    @PostConstruct
    public void init() {
        log.error("✅✅✅ OrdersExportConsumer @PostConstruct called! RabbitListener should be ready! ✅✅✅");
        System.out.println("✅✅✅ OrdersExportConsumer @PostConstruct called! ✅✅✅");
        System.err.println("✅✅✅ OrdersExportConsumer @PostConstruct called! ✅✅✅");
    }

    @RabbitListener(
        queues = "orders.export.q",
        containerFactory = "rabbitListenerContainerFactory",
        ackMode = "AUTO"
    )
    public void consume(ExchangeJob job) {
        log.error("📥📥📥 RECEIVED MESSAGE! RequestId: {}, Filename: {} 📥📥📥", 
                 job.requestId(), job.filename());
        System.out.println("📥📥📥 RECEIVED: " + job.requestId());
        System.err.println("📥📥📥 RECEIVED: " + job.requestId());
        
        try {
            String key = job.requestId() + ":" + job.createdAt();
            if (!idempotencyGuard.tryAcquire(key, "orders.export")) {
                log.info("Skip duplicate orders export {}", key);
                return;
            }
            log.info("🔄 Processing orders export job: {}", job.requestId());
            String objectKey = ordersExportService.exportOrders(job.requestId());
            log.info("✅ Orders export produced {}", objectKey);
        } catch (Exception e) {
            log.error("❌ Orders export job failed", e);
            e.printStackTrace();
            throw e;
        }
    }
}
