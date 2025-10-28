package autoparts.kz.modules.cml.queue.consumers;

import autoparts.kz.modules.cml.config.CommerceMlProperties;
import autoparts.kz.modules.cml.domain.dto.ExchangeJob;
import autoparts.kz.modules.cml.parser.CmlImportParser;
import autoparts.kz.modules.cml.parser.CmlImportParser.ProductRecord;
import autoparts.kz.modules.cml.service.CatalogImportService;
import autoparts.kz.modules.cml.service.ProductSyncService;
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
public class CatalogImportConsumer {

    private static final Logger log = LoggerFactory.getLogger(CatalogImportConsumer.class);

    private final S3Storage storage;
    private final CmlImportParser parser;
    private final CatalogImportService catalogImportService;
    private final ProductSyncService productSyncService;
    private final CommerceMlProperties properties;
    private final IdempotencyGuard idempotencyGuard;

    public CatalogImportConsumer(S3Storage storage,
                                 CmlImportParser parser,
                                 CatalogImportService catalogImportService,
                                 ProductSyncService productSyncService,
                                 CommerceMlProperties properties,
                                 IdempotencyGuard idempotencyGuard) {
        this.storage = storage;
        this.parser = parser;
        this.catalogImportService = catalogImportService;
        this.productSyncService = productSyncService;
        this.properties = properties;
        this.idempotencyGuard = idempotencyGuard;
    }

    @RabbitListener(queues = "import.catalog.q")
    public void consume(ExchangeJob job) throws Exception {
        String key = job.requestId() + ":" + job.objectKey();
        if (!idempotencyGuard.tryAcquire(key, "catalog.import")) {
            log.info("Skipping catalog import {} already processed", key);
            return;
        }
        
        try {
            byte[] payload = storage.getObject(job.objectKey());
            InputStream xmlStream = resolvePayloadStream(job.filename(), payload);
            parser.parse(xmlStream, properties.getBatchSize(), this::processBatch);
            log.info("✅ Catalog import completed for {}", job.objectKey());
            
            // Синхронизация товаров из cml_products в products
            log.info("🔄 Starting product synchronization from staging to main tables...");
            productSyncService.fullSync();
            log.info("✅ Product synchronization completed successfully");
            
        } catch (Exception e) {
            log.error("❌ Error during catalog import or sync: {}", e.getMessage(), e);
            throw e;
        }
    }

    private void processBatch(java.util.List<ProductRecord> batch) {
        catalogImportService.upsertProducts(batch);
    }

    private InputStream resolvePayloadStream(String filename, byte[] payload) throws Exception {
        if (filename != null && filename.toLowerCase().endsWith(".zip")) {
            long limit = properties.getMaxUnzippedSizeMb() * 1024L * 1024L;
            ZipUtil.assertWithinLimit(payload, limit);
            
            // 🔍 Определяем тип файла внутри архива
            try {
                log.info("Extracting catalog XML from ZIP archive: {}", filename);
                byte[] xml = ZipUtil.extractEntryByPrefix(payload, "import");
                log.info("✅ Successfully extracted catalog XML (import*.xml) from archive");
                return new ByteArrayInputStream(xml);
            } catch (IllegalArgumentException e) {
                // Если не найден import*.xml, проверяем, может это offers*.xml
                if (e.getMessage().contains("No XML entry starting with 'import'")) {
                    log.warn("⚠️ Archive {} contains offers*.xml instead of import*.xml - this should be processed by OffersImportConsumer", filename);
                    log.info("🔄 Attempting to extract offers XML to verify...");
                    try {
                        byte[] offersXml = ZipUtil.extractEntryByPrefix(payload, "offers");
                        log.error("❌ Found offers*.xml in catalog queue! This file should be routed to offers.import.q queue. Please check ImportCoordinator routing logic.");
                        throw new IllegalStateException(
                            "Archive contains offers*.xml but was routed to catalog import queue. " +
                            "This indicates a routing misconfiguration. File: " + filename
                        );
                    } catch (IllegalArgumentException ex2) {
                        log.error("❌ Archive contains neither import*.xml nor offers*.xml - invalid CommerceML archive");
                        throw new IllegalArgumentException("Invalid CommerceML archive: must contain import*.xml or offers*.xml", e);
                    }
                }
                throw e;
            }
        }
        return new ByteArrayInputStream(payload);
    }
}
