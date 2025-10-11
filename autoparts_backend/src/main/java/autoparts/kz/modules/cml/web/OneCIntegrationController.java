package autoparts.kz.modules.cml.web;

import autoparts.kz.modules.cml.service.OneCIntegrationPublisherService;
import autoparts.kz.modules.cml.service.OneCQueueMonitoringService;
import autoparts.kz.modules.stockOneC.service.OneCIntegrationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST контроллер для управления интеграцией с 1C.
 * Предоставляет API для мониторинга очередей, проверки соединения и управления синхронизацией.
 */
@RestController
@RequestMapping("/api/integration/1c")
@RequiredArgsConstructor
@Slf4j
public class OneCIntegrationController {

    private final OneCIntegrationService oneCIntegrationService;
    private final OneCQueueMonitoringService queueMonitoringService;
    private final OneCIntegrationPublisherService publisherService;

    /**
     * Проверка соединения с системой 1C
     */
    @GetMapping("/connection/test")
    public ResponseEntity<Map<String, Object>> testConnection() {
        try {
            boolean connected = oneCIntegrationService.testConnection();
            
            return ResponseEntity.ok(Map.of(
                "connected", connected,
                "status", connected ? "OK" : "FAILED",
                "message", connected ? "Соединение с 1С установлено" : "Не удалось соединиться с 1С"
            ));
        } catch (Exception e) {
            log.error("Error testing 1C connection: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of(
                "connected", false,
                "status", "ERROR",
                "message", "Ошибка проверки соединения: " + e.getMessage()
            ));
        }
    }

    /**
     * Получение статистики очередей интеграции
     */
    @GetMapping("/queues/stats")
    public ResponseEntity<Map<String, OneCQueueMonitoringService.QueueStats>> getQueuesStats() {
        try {
            Map<String, OneCQueueMonitoringService.QueueStats> stats = queueMonitoringService.getIntegrationQueuesStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error getting queue stats: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Проверка здоровья очередей
     */
    @GetMapping("/queues/health")
    public ResponseEntity<Map<String, Object>> checkQueuesHealth() {
        try {
            boolean healthy = queueMonitoringService.areIntegrationQueuesHealthy();
            String report = queueMonitoringService.getQueuesHealthReport();
            
            return ResponseEntity.ok(Map.of(
                "healthy", healthy,
                "status", healthy ? "OK" : "UNHEALTHY",
                "report", report
            ));
        } catch (Exception e) {
            log.error("Error checking queue health: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of(
                "healthy", false,
                "status", "ERROR",
                "error", e.getMessage()
            ));
        }
    }

    /**
     * Получение статистики конкретной очереди
     */
    @GetMapping("/queues/{queueName}/stats")
    public ResponseEntity<OneCQueueMonitoringService.QueueStats> getQueueStats(@PathVariable String queueName) {
        try {
            OneCQueueMonitoringService.QueueStats stats = queueMonitoringService.getQueueStats(queueName);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error getting stats for queue {}: {}", queueName, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Запуск синхронизации каталога
     */
    @PostMapping("/catalog/sync")
    public ResponseEntity<Map<String, Object>> syncCatalog() {
        try {
            oneCIntegrationService.syncCatalog();
            
            return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "Синхронизация каталога запущена успешно"
            ));
        } catch (Exception e) {
            log.error("Error syncing catalog: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of(
                "status", "ERROR",
                "message", "Ошибка синхронизации каталога: " + e.getMessage()
            ));
        }
    }

    /**
     * Отправка ожидающих заказов в 1С
     */
    @PostMapping("/orders/send-pending")
    public ResponseEntity<Map<String, Object>> sendPendingOrders() {
        try {
            oneCIntegrationService.sendPendingOrdersToOneC();
            
            return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "Отправка ожидающих заказов запущена успешно"
            ));
        } catch (Exception e) {
            log.error("Error sending pending orders: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of(
                "status", "ERROR",
                "message", "Ошибка отправки ожидающих заказов: " + e.getMessage()
            ));
        }
    }

    /**
     * Получение последнего статуса синхронизации
     */
    @GetMapping("/sync/status")
    public ResponseEntity<OneCIntegrationService.SyncStatus> getSyncStatus() {
        try {
            OneCIntegrationService.SyncStatus status = oneCIntegrationService.getLastSyncStatus();
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            log.error("Error getting sync status: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Общий статус интеграции
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getIntegrationStatus() {
        try {
            // Проверяем соединение с 1С
            boolean connected = oneCIntegrationService.testConnection();
            
            // Проверяем здоровье очередей
            boolean queuesHealthy = queueMonitoringService.areIntegrationQueuesHealthy();
            
            // Получаем статистику очередей
            Map<String, OneCQueueMonitoringService.QueueStats> queueStats = queueMonitoringService.getIntegrationQueuesStats();
            
            // Получаем статус синхронизации
            OneCIntegrationService.SyncStatus syncStatus = oneCIntegrationService.getLastSyncStatus();
            
            boolean overallHealthy = connected && queuesHealthy;
            
            return ResponseEntity.ok(Map.of(
                "overall_status", overallHealthy ? "HEALTHY" : "UNHEALTHY",
                "connection_1c", Map.of(
                    "connected", connected,
                    "status", connected ? "OK" : "FAILED"
                ),
                "queues", Map.of(
                    "healthy", queuesHealthy,
                    "stats", queueStats
                ),
                "last_sync", syncStatus,
                "timestamp", System.currentTimeMillis()
            ));
        } catch (Exception e) {
            log.error("Error getting integration status: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of(
                "overall_status", "ERROR",
                "error", e.getMessage(),
                "timestamp", System.currentTimeMillis()
            ));
        }
    }
}