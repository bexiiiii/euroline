package autoparts.kz.modules.cml.service;

import autoparts.kz.modules.cml.config.CommerceMlProperties;
import autoparts.kz.modules.cml.domain.dto.ExchangeJob;
import autoparts.kz.modules.cml.queue.JobQueue;
import autoparts.kz.modules.cml.queue.JobType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class OneCExchangeService {

    private static final Logger log = LoggerFactory.getLogger(OneCExchangeService.class);

    private final CommerceMlProperties properties;
    private final ImportCoordinator importCoordinator;
    private final S3Storage storage;
    private final JobQueue jobQueue;
    private final ReturnIntegrationService returnIntegrationService;

    public OneCExchangeService(CommerceMlProperties properties,
                               ImportCoordinator importCoordinator,
                               S3Storage storage,
                               JobQueue jobQueue,
                               ReturnIntegrationService returnIntegrationService) {
        this.properties = properties;
        this.importCoordinator = importCoordinator;
        this.storage = storage;
        this.jobQueue = jobQueue;
        this.returnIntegrationService = returnIntegrationService;
    }

    public String handleCheckAuth() {
        String uuid = UUID.randomUUID().toString();
        return String.join("\n",
                "success",
                "cookie_name",
                "JSESSIONID",
                "cookie_value",
                uuid);
    }

    public String handleInit() {
        long limit = properties.getMaxFileSizeMb() * 1024L * 1024L;
        return String.join("\n",
                "zip=yes",
                "file_limit=" + limit);
    }

    public String handleFileUpload(String type,
                                   String filename,
                                   InputStream body,
                                   long contentLength,
                                   String requestId) {
        enforceSizeLimit(contentLength);
        try {
            String objectKey = importCoordinator.storeChunk(type, filename, body, requestId);
            log.info("Stored chunk for {} {} at {}", type, filename, objectKey);
            return "success";
        } catch (IOException e) {
            log.error("Failed to store chunk {}", filename, e);
            throw new IllegalStateException("Failed to store file chunk", e);
        }
    }

    public String handleImport(String type, String filename, String requestId) {
        log.info("🔄 handleImport called - type={}, filename={}, requestId={}", type, filename, requestId);
        String objectKey = importCoordinator.finalizeUpload(type, filename, requestId);
        log.info("✅ Queued import for {} {}", type, objectKey);
        return "progress\nqueued";
    }

    public String handleSaleQuery(String requestId) {
        try {
            Optional<String> latest = findLatestOrdersFile();
            if (latest.isEmpty()) {
                queueOrdersExport(requestId);
                return "progress\norders export scheduled";
            }
            byte[] data = storage.getObject(latest.get());
            return new String(data);
        } catch (Exception e) {
            log.error("Error in handleSaleQuery", e);
            e.printStackTrace();
            return "failure\nerror fetching orders";
        }
    }

    public String handleSaleSuccess() {
        return "success";
    }

    /**
     * ✅ НОВОЕ: Обработка запроса возвратов от 1C
     * Endpoint: GET /api/1c-exchange?type=return&mode=query
     * 
     * Возвращает XML с одобренными возвратами, которые нужно обработать в 1C
     */
    public String handleReturnQuery(String requestId) {
        log.info("[{}] 1C запрашивает возвраты товаров", requestId);
        
        try {
            // Генерируем XML со всеми одобренными возвратами
            String xml = returnIntegrationService.generateReturnsPackageXml();
            
            if (xml.contains("<!-- Нет возвратов для выгрузки -->")) {
                log.info("[{}] Нет возвратов для отправки в 1C", requestId);
            } else {
                log.info("[{}] Отправляем возвраты в 1C", requestId);
            }
            
            return xml;
                    
        } catch (Exception e) {
            log.error("[{}] Ошибка формирования возвратов: {}", requestId, e.getMessage(), e);
            e.printStackTrace();
            return "failure\nerror generating returns";
        }
    }

    /**
     * ✅ НОВОЕ: Подтверждение получения возвратов 1C системой
     * Endpoint: GET /api/1c-exchange?type=return&mode=success
     * 
     * 1C вызывает этот endpoint после успешной обработки возвратов
     */
    public String handleReturnSuccess() {
        log.info("1C подтвердила получение возвратов");
        // Можно дополнительно пометить возвраты как обработанные
        // но мы уже помечаем их при генерации XML
        return "success";
    }

    private Optional<String> findLatestOrdersFile() {
        List<software.amazon.awssdk.services.s3.model.S3Object> objects =
                storage.listObjects("commerce-ml/outbox/orders/");
        return objects.stream()
                .max(Comparator.comparing(software.amazon.awssdk.services.s3.model.S3Object::lastModified))
                .map(software.amazon.awssdk.services.s3.model.S3Object::key);
    }

    private void queueOrdersExport(String requestId) {
        ExchangeJob job = new ExchangeJob(JobType.ORDERS_EXPORT.routingKey(),
                "orders.xml",
                "",
                requestId,
                Instant.now());
        jobQueue.submit(JobType.ORDERS_EXPORT, job);
    }

    private void enforceSizeLimit(long contentLength) {
        long limit = properties.getMaxFileSizeMb() * 1024L * 1024L;
        if (contentLength > 0 && contentLength > limit) {
            throw new IllegalArgumentException("File chunk exceeds limit of " + limit + " bytes");
        }
    }
}
