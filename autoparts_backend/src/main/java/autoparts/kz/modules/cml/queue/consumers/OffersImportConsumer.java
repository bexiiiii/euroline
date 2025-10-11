package autoparts.kz.modules.cml.queue.consumers;

import autoparts.kz.modules.cml.config.CommerceMlProperties;
import autoparts.kz.modules.cml.domain.dto.ExchangeJob;
import autoparts.kz.modules.cml.parser.CmlOffersParser;
import autoparts.kz.modules.cml.parser.CmlOffersParser.OfferRecord;
import autoparts.kz.modules.cml.service.OffersImportService;
import autoparts.kz.modules.cml.service.S3Storage;
import autoparts.kz.modules.cml.util.IdempotencyGuard;
import autoparts.kz.modules.cml.util.ZipUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.List;

@Component
public class OffersImportConsumer {

    private static final Logger log = LoggerFactory.getLogger(OffersImportConsumer.class);

    private final S3Storage storage;
    private final CmlOffersParser parser;
    private final OffersImportService offersImportService;
    private final CommerceMlProperties properties;
    private final IdempotencyGuard idempotencyGuard;

    public OffersImportConsumer(S3Storage storage,
                                CmlOffersParser parser,
                                OffersImportService offersImportService,
                                CommerceMlProperties properties,
                                IdempotencyGuard idempotencyGuard) {
        this.storage = storage;
        this.parser = parser;
        this.offersImportService = offersImportService;
        this.properties = properties;
        this.idempotencyGuard = idempotencyGuard;
    }

    @RabbitListener(queues = "offers.import.q")
    public void consume(ExchangeJob job) throws Exception {
        String key = job.requestId() + ":" + job.objectKey();
        if (!idempotencyGuard.tryAcquire(key, "offers.import")) {
            log.info("Skip offers import {} already processed", key);
            return;
        }
        byte[] payload = storage.getObject(job.objectKey());
        InputStream xmlStream = resolvePayloadStream(job.filename(), payload);
        parser.parse(xmlStream, properties.getBatchSize(), this::processBatch);
        log.info("Offers import done for {}", job.objectKey());
    }

    private void processBatch(List<OfferRecord> batch) {
        offersImportService.upsertOffers(batch);
    }

    private InputStream resolvePayloadStream(String filename, byte[] payload) throws Exception {
        if (filename != null && filename.toLowerCase().endsWith(".zip")) {
            long limit = properties.getMaxUnzippedSizeMb() * 1024L * 1024L;
            ZipUtil.assertWithinLimit(payload, limit);
            byte[] xml = ZipUtil.extractEntry(payload, "offers.xml");
            return new ByteArrayInputStream(xml);
        }
        return new ByteArrayInputStream(payload);
    }
}
