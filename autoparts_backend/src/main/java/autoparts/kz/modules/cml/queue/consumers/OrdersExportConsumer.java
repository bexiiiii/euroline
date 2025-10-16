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
        log.info("🚀 OrdersExportConsumer initialized and ready to consume from 'orders.export.q'");
    }

    @PostConstruct
    public void init() {
        log.info("✅ OrdersExportConsumer PostConstruct completed - listener should be registered now");
    }

    @RabbitListener(
        queues = "orders.export.q",
        containerFactory = "rabbitListenerContainerFactory",
        ackMode = "AUTO"
    )
    public void consume(ExchangeJob job) {
        log.info("📥 RECEIVED message in OrdersExportConsumer: requestId={}, filename={}, objectKey={}", 
                 job.requestId(), job.filename(), job.objectKey());
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
