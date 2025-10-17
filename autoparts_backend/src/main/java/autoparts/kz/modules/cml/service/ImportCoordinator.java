package autoparts.kz.modules.cml.service;

import autoparts.kz.modules.cml.domain.dto.ExchangeJob;
import autoparts.kz.modules.cml.queue.JobQueue;
import autoparts.kz.modules.cml.queue.JobType;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ImportCoordinator {

    private static final Logger log = LoggerFactory.getLogger(ImportCoordinator.class);

    private final S3Storage storage;
    private final JobQueue jobQueue;
    private final Map<String, UploadSession> sessions = new ConcurrentHashMap<>();

    public ImportCoordinator(S3Storage storage, JobQueue jobQueue) {
        this.storage = storage;
        this.jobQueue = jobQueue;
    }

    public String storeChunk(String type, String filename, InputStream inputStream, String requestId) throws IOException {
        String key = sessionKey(type, filename, requestId);
        log.info("📦 storeChunk: type={}, filename={}, requestId={}, sessionKey={}", type, filename, requestId, key);
        
        UploadSession session = sessions.computeIfAbsent(key, ignored -> {
            UploadSession newSession = newSession(filename);
            log.info("🆕 Created new session for {}: objectKey={}", filename, newSession.objectKey);
            return newSession;
        });
        
        if (!session.initialized) {
            log.info("🚀 Initializing multipart upload for objectKey={}", session.objectKey);
            String uploadId = storage.initiateMultipartUpload(session.objectKey, resolveContentType(filename));
            log.info("✅ Multipart upload initialized with uploadId={}", uploadId);
            session.initialized = true;
        }
        
        log.info("⬆️ Uploading part to objectKey={}", session.objectKey);
        storage.uploadPart(session.objectKey, inputStream);
        log.info("✅ Part uploaded successfully to objectKey={}", session.objectKey);
        
        return session.objectKey;
    }

    public String finalizeUpload(String type, String filename, String requestId) {
        String key = sessionKey(type, filename, requestId);
        log.info("🏁 finalizeUpload: type={}, filename={}, requestId={}, sessionKey={}", type, filename, requestId, key);
        
        UploadSession session = sessions.remove(key);
        if (session == null) {
            log.error("❌ No upload session found for filename={}, requestId={}", filename, requestId);
            throw new IllegalStateException("No upload session for " + filename + " " + requestId);
        }
        
        log.info("📝 Session found: objectKey={}, initialized={}", session.objectKey, session.initialized);
        
        log.info("🔄 Completing multipart upload...");
        storage.completeMultipartUpload(session.objectKey);
        log.info("✅ Multipart upload completed");
        
        JobType jobType = resolveJobType(type, filename);
        log.info("📋 Resolved job type: {}", jobType);
        
        ExchangeJob job = new ExchangeJob(jobType.routingKey(), filename, session.objectKey, requestId, Instant.now());
        log.info("📤 Submitting job to queue: type={}, objectKey={}", jobType, session.objectKey);
        jobQueue.submit(jobType, job);
        
        return session.objectKey;
    }

    public JobType resolveJobType(String type, String filename) {
        if ("catalog".equalsIgnoreCase(type)) {
            if (filename.toLowerCase().contains("offer")) {
                return JobType.OFFERS_IMPORT;
            }
            return JobType.CATALOG_IMPORT;
        }
        if ("sale".equalsIgnoreCase(type)) {
            return JobType.ORDERS_APPLY;
        }
        throw new IllegalArgumentException("Unsupported type " + type);
    }

    @PreDestroy
    public void cleanupSessions() {
        sessions.values().forEach(session -> {
            try {
                storage.abortMultipartUpload(session.objectKey);
            } catch (Exception e) {
                log.warn("Failed to abort upload {}: {}", session.objectKey, e.getMessage());
            }
        });
        sessions.clear();
    }

    /**
     * Получить информацию о текущих активных сессиях
     */
    public Map<String, Object> getSessionsInfo() {
        Map<String, Object> info = new java.util.HashMap<>();
        info.put("activeSessionsCount", sessions.size());
        info.put("sessions", sessions.entrySet().stream()
                .map(entry -> Map.of(
                        "key", entry.getKey(),
                        "objectKey", entry.getValue().objectKey,
                        "initialized", entry.getValue().initialized
                ))
                .toList());
        return info;
    }

    private UploadSession newSession(String filename) {
        LocalDate today = LocalDate.now();
        String objectKey = "commerce-ml/inbox/%d/%02d/%02d/%s/%s".formatted(
                today.getYear(),
                today.getMonthValue(),
                today.getDayOfMonth(),
                UUID.randomUUID(),
                filename);
        return new UploadSession(objectKey);
    }

    private String sessionKey(String type, String filename, String requestId) {
        return type + ":" + filename + ":" + requestId;
    }

    private String resolveContentType(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".xml")) {
            return "application/xml";
        }
        if (lower.endsWith(".zip")) {
            return "application/zip";
        }
        return "application/octet-stream";
    }

    private static class UploadSession {
        final String objectKey;
        boolean initialized;

        private UploadSession(String objectKey) {
            this.objectKey = objectKey;
        }
    }
}
