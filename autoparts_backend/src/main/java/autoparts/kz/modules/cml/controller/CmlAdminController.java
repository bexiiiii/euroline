package autoparts.kz.modules.cml.controller;

import autoparts.kz.modules.cml.service.ImportCoordinator;
import autoparts.kz.modules.cml.service.S3Storage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Административный контроллер для управления CML интеграцией
 */
@RestController
@RequestMapping("/api/admin/cml")
public class CmlAdminController {

    private static final Logger log = LoggerFactory.getLogger(CmlAdminController.class);
    
    private final ImportCoordinator importCoordinator;
    private final S3Storage s3Storage;

    public CmlAdminController(ImportCoordinator importCoordinator, S3Storage s3Storage) {
        this.importCoordinator = importCoordinator;
        this.s3Storage = s3Storage;
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
}
