package autoparts.kz.modules.cml.controller;

import autoparts.kz.modules.cml.domain.dto.ExchangeJob;
import autoparts.kz.modules.cml.queue.JobQueue;
import autoparts.kz.modules.cml.queue.JobType;
import autoparts.kz.modules.cml.repo.CmlProcessedMessageRepository;
import autoparts.kz.modules.cml.service.ImportCoordinator;
import autoparts.kz.modules.cml.service.S3Storage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Административный контроллер для управления CML интеграцией
 */
@RestController
@RequestMapping("/api/admin/cml")
public class CmlAdminController {

    private static final Logger log = LoggerFactory.getLogger(CmlAdminController.class);
    
    private final ImportCoordinator importCoordinator;
    private final S3Storage s3Storage;
    private final CmlProcessedMessageRepository processedMessageRepository;
    private final JobQueue jobQueue;

    public CmlAdminController(ImportCoordinator importCoordinator, 
                             S3Storage s3Storage,
                             CmlProcessedMessageRepository processedMessageRepository,
                             JobQueue jobQueue) {
        this.importCoordinator = importCoordinator;
        this.s3Storage = s3Storage;
        this.processedMessageRepository = processedMessageRepository;
        this.jobQueue = jobQueue;
    }

    /**
     * Получить информацию о текущих активных сессиях загрузки
     */
    @GetMapping("/sessions")
    public ResponseEntity<Map<String, Object>> getActiveSessions() {
        Map<String, Object> info = importCoordinator.getSessionsInfo();
        return ResponseEntity.ok(info);
    }

    /**
     * Принудительная очистка всех незавершенных сессий
     */
    @PostMapping("/sessions/cleanup")
    public ResponseEntity<Map<String, Object>> cleanupSessions() {
        log.warn("Manual cleanup of upload sessions requested");
        importCoordinator.cleanupSessions();
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "All upload sessions cleaned up");
        
        return ResponseEntity.ok(response);
    }

    /**
     * Получить список файлов в inbox
     */
    @GetMapping("/inbox/files")
    public ResponseEntity<Map<String, Object>> listInboxFiles() {
        var files = s3Storage.listObjects("commerce-ml/inbox/");
        
        Map<String, Object> response = new HashMap<>();
        response.put("count", files.size());
        response.put("files", files.stream()
                .map(obj -> Map.of(
                        "key", obj.key(),
                        "size", obj.size(),
                        "lastModified", obj.lastModified().toString()
                ))
                .toList());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Получить конфигурацию S3
     */
    @GetMapping("/s3/config")
    public ResponseEntity<Map<String, Object>> getS3Config() {
        var props = s3Storage.properties();
        
        Map<String, Object> config = new HashMap<>();
        config.put("endpoint", props.getEndpoint());
        config.put("region", props.getRegion());
        config.put("bucket", props.getBucket());
        config.put("accessKey", props.getAccessKey().substring(0, Math.min(4, props.getAccessKey().length())) + "***");
        
        return ResponseEntity.ok(config);
    }

    /**
     * Очистить записи об обработанных сообщениях (idempotency guard)
     * Это позволяет пере-импортировать уже обработанные файлы
     */
    @PostMapping("/idempotency/clear")
    public ResponseEntity<Map<String, Object>> clearIdempotency(
            @RequestParam(required = false) String type) {
        
        long deletedCount;
        if (type != null && !type.isBlank()) {
            deletedCount = processedMessageRepository.deleteByType(type);
            log.warn("Cleared {} idempotency records for type: {}", deletedCount, type);
        } else {
            deletedCount = processedMessageRepository.count();
            processedMessageRepository.deleteAll();
            log.warn("Cleared ALL {} idempotency records", deletedCount);
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("deletedCount", deletedCount);
        response.put("type", type != null ? type : "all");
        response.put("message", "Idempotency records cleared. Files can now be re-imported.");
        
        return ResponseEntity.ok(response);
    }

    /**
     * Получить статистику по обработанным сообщениям
     */
    @GetMapping("/idempotency/stats")
    public ResponseEntity<Map<String, Object>> getIdempotencyStats() {
        long totalCount = processedMessageRepository.count();
        
        Map<String, Object> response = new HashMap<>();
        response.put("totalProcessed", totalCount);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Вручную запустить импорт файла из S3
     * Полезно после очистки idempotency для пере-импорта
     */
    @PostMapping("/import/trigger")
    public ResponseEntity<Map<String, Object>> triggerImport(
            @RequestParam String objectKey,
            @RequestParam(defaultValue = "CATALOG_IMPORT") String jobTypeName) {
        
        try {
            // Определяем JobType
            JobType jobType;
            try {
                jobType = JobType.valueOf(jobTypeName);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invalid job type. Use: CATALOG_IMPORT or OFFERS_IMPORT"));
            }
            
            // Создаем новый requestId для обхода idempotency
            String requestId = "manual-" + UUID.randomUUID().toString();
            String filename = objectKey.substring(objectKey.lastIndexOf('/') + 1);
            
            // ExchangeJob(type, filename, objectKey, requestId, createdAt)
            ExchangeJob job = new ExchangeJob(
                    jobType.name(),
                    filename,
                    objectKey,
                    requestId,
                    java.time.Instant.now()
            );
            
            jobQueue.submit(jobType, job);
            
            log.info("Manually triggered {} for file: {}", jobType, objectKey);
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Import job submitted");
            response.put("requestId", requestId);
            response.put("objectKey", objectKey);
            response.put("jobType", jobType.name());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to trigger import", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
