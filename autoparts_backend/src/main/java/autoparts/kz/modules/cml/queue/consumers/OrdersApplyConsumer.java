package autoparts.kz.modules.cml.queue.consumers;

import autoparts.kz.modules.cml.config.CommerceMlProperties;
import autoparts.kz.modules.cml.domain.dto.ExchangeJob;
import autoparts.kz.modules.cml.parser.CmlOrdersChangeParser;
import autoparts.kz.modules.cml.parser.CmlOrdersChangeParser.OrderChange;
import autoparts.kz.modules.cml.service.OrdersApplyService;
import autoparts.kz.modules.cml.service.S3Storage;
import autoparts.kz.modules.cml.util.IdempotencyGuard;
import autoparts.kz.modules.cml.util.ZipUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.InputStream;

@Component
public class OrdersApplyConsumer {

    private static final Logger log = LoggerFactory.getLogger(OrdersApplyConsumer.class);

    private final S3Storage storage;
    private final CmlOrdersChangeParser parser;
    private final OrdersApplyService ordersApplyService;
    private final CommerceMlProperties properties;
    private final IdempotencyGuard idempotencyGuard;

    public OrdersApplyConsumer(S3Storage storage,
                               CmlOrdersChangeParser parser,
                               OrdersApplyService ordersApplyService,
                               CommerceMlProperties properties,
                               IdempotencyGuard idempotencyGuard) {
        this.storage = storage;
        this.parser = parser;
        this.ordersApplyService = ordersApplyService;
        this.properties = properties;
        this.idempotencyGuard = idempotencyGuard;
    }

    @RabbitListener(queues = "orders.apply.q")
    public void consume(ExchangeJob job) throws Exception {
        String key = job.requestId() + ":" + job.objectKey();
        if (!idempotencyGuard.tryAcquire(key, "orders.apply.file")) {
            log.info("Skip duplicate orders apply file {}", key);
            return;
        }
        byte[] payload = storage.getObject(job.objectKey());
        InputStream xmlStream = resolvePayloadStream(job.filename(), payload);
        parser.parse(xmlStream, change -> ordersApplyService.applyChange(change, job.requestId()));
        log.info("Orders change file processed {}", job.objectKey());
    }

    private InputStream resolvePayloadStream(String filename, byte[] payload) throws Exception {
        if (filename != null && filename.toLowerCase().endsWith(".zip")) {
            long limit = properties.getMaxUnzippedSizeMb() * 1024L * 1024L;
            ZipUtil.assertWithinLimit(payload, limit);
            byte[] xml = ZipUtil.extractEntry(payload, "orders_changes.xml");
            return new ByteArrayInputStream(xml);
        }
        return new ByteArrayInputStream(payload);
    }
}
