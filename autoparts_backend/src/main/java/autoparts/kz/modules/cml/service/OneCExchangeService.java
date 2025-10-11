package autoparts.kz.modules.cml.service;

import autoparts.kz.modules.cml.config.CommerceMlProperties;
import autoparts.kz.modules.cml.domain.dto.ExchangeJob;
import autoparts.kz.modules.cml.queue.JobQueue;
import autoparts.kz.modules.cml.queue.JobType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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

    public OneCExchangeService(CommerceMlProperties properties,
                               ImportCoordinator importCoordinator,
                               S3Storage storage,
                               JobQueue jobQueue) {
        this.properties = properties;
        this.importCoordinator = importCoordinator;
        this.storage = storage;
        this.jobQueue = jobQueue;
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
        String objectKey = importCoordinator.finalizeUpload(type, filename, requestId);
        log.info("Queued import for {} {}", type, objectKey);
        return "progress\nqueued";
    }

    public ResponseEntity<byte[]> handleSaleQuery(String requestId) {
        Optional<String> latest = findLatestOrdersFile();
        if (latest.isEmpty()) {
            queueOrdersExport(requestId);
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_PLAIN)
                    .body("progress\norders export scheduled".getBytes());
        }
        byte[] data = storage.getObject(latest.get());
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_XML)
                .body(data);
    }

    public String handleSaleSuccess() {
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
