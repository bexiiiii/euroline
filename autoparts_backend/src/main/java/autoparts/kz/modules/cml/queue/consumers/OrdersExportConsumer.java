package autoparts.kz.modules.cml.queue.consumers;

import autoparts.kz.modules.cml.domain.dto.ExchangeJob;
import autoparts.kz.modules.cml.service.OrdersExportService;
import autoparts.kz.modules.cml.util.IdempotencyGuard;
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
    }

    @RabbitListener(queues = "orders.export.q")
    public void consume(ExchangeJob job) {
        String key = job.requestId() + ":" + job.createdAt();
        if (!idempotencyGuard.tryAcquire(key, "orders.export")) {
            log.info("Skip duplicate orders export {}", key);
            return;
        }
        String objectKey = ordersExportService.exportOrders(job.requestId());
        log.info("Orders export produced {}", objectKey);
    }
}
