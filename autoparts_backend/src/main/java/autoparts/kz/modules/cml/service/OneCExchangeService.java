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
            
            // 🔥 НОВОЕ: Автоматически финализируем и запускаем импорт после загрузки
            // Это нужно потому что некоторые версии 1С не вызывают mode=import
            log.info("🔄 Auto-finalizing upload and triggering import for {}", filename);
            String finalizedKey = importCoordinator.finalizeUpload(type, filename, requestId);
            log.info("✅ Upload finalized and import queued: {}", finalizedKey);
            
            return "success";
        } catch (IOException e) {
            log.error("Failed to store chunk {}", filename, e);
            throw new IllegalStateException("Failed to store file chunk", e);
        }
    }

    public String handleImport(String type, String filename, String requestId) {
        log.info("🔄 handleImport called - type={}, filename={}, requestId={}", type, filename, requestId);
        
        try {
            String objectKey = importCoordinator.finalizeUpload(type, filename, requestId);
            log.info("✅ Queued import for {} {}", type, objectKey);
            return "progress\nqueued";
        } catch (IllegalStateException e) {
            // Сессия не найдена - возможно уже была финализирована при загрузке
            log.warn("⚠️ Upload session not found - likely already finalized: {}", e.getMessage());
            return "success\nalready imported";
        }
    }

    public String handleSaleQuery(String requestId) {
        try {
            log.info("🔍 [{}] handleSaleQuery called - searching for orders file", requestId);
            
            Optional<String> latest = findLatestOrdersFile();
            if (latest.isEmpty()) {
                log.warn("⚠️ [{}] No orders file found in MinIO, queuing export", requestId);
                queueOrdersExport(requestId);
                return "progress\norders export scheduled";
            }
            
            log.info("📄 [{}] Found orders file: {}", requestId, latest.get());
            byte[] data = storage.getObject(latest.get());
            String xmlContent = new String(data);
            
            // Логируем первые 500 символов XML для диагностики
            String preview = xmlContent.length() > 500 
                ? xmlContent.substring(0, 500) + "..." 
                : xmlContent;
            log.info("📦 [{}] Returning orders XML ({} bytes): {}", 
                requestId, data.length, preview);
            
            return xmlContent;
        } catch (Exception e) {
            log.error("❌ [{}] Error in handleSaleQuery", requestId, e);
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
        // Ищем файлы только за сегодняшнюю дату для избежания получения старых файлов
        java.time.LocalDate today = java.time.LocalDate.now();
        String todayPrefix = String.format("commerce-ml/outbox/orders/%d/%02d/%02d/", 
            today.getYear(), today.getMonthValue(), today.getDayOfMonth());
        
        log.info("🔍 Listing objects in {}", todayPrefix);
        List<software.amazon.awssdk.services.s3.model.S3Object> objects =
                storage.listObjects(todayPrefix);
        
        log.info("📂 Found {} objects in today's orders outbox", objects.size());
        objects.forEach(obj -> 
            log.debug("  - {} (modified: {})", obj.key(), obj.lastModified())
        );
        
        Optional<String> result = objects.stream()
                .max(Comparator.comparing(software.amazon.awssdk.services.s3.model.S3Object::lastModified))
                .map(software.amazon.awssdk.services.s3.model.S3Object::key);
        
        if (result.isPresent()) {
            log.info("✅ Latest orders file: {}", result.get());
        } else {
            log.warn("⚠️ No orders files found in today's outbox: {}", todayPrefix);
        }
        
        return result;
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
