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
        UploadSession session = sessions.computeIfAbsent(key, ignored -> newSession(filename));
        if (!session.initialized) {
            storage.initiateMultipartUpload(session.objectKey, resolveContentType(filename));
            session.initialized = true;
        }
        storage.uploadPart(session.objectKey, inputStream);
        return session.objectKey;
    }

    public String finalizeUpload(String type, String filename, String requestId) {
        String key = sessionKey(type, filename, requestId);
        UploadSession session = sessions.remove(key);
        if (session == null) {
            throw new IllegalStateException("No upload session for " + filename + " " + requestId);
        }
        storage.completeMultipartUpload(session.objectKey);
        JobType jobType = resolveJobType(type, filename);
        ExchangeJob job = new ExchangeJob(jobType.routingKey(), filename, session.objectKey, requestId, Instant.now());
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
