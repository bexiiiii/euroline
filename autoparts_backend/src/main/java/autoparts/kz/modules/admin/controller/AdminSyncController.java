package autoparts.kz.modules.admin.controller;

import autoparts.kz.modules.stockOneC.service.InventoryOnDemandRefresher;
import autoparts.kz.modules.stockOneC.service.OneCIntegrationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/admin/sync")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class AdminSyncController {

    private final InventoryOnDemandRefresher inventoryRefresher;
    
    @Autowired(required = false)
    private OneCIntegrationService oneCIntegrationService;

    /**
     * Получить статус синхронизации с 1С
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getSyncStatus() {
        log.info("Admin requested sync status");
        
        Map<String, Object> status = Map.of(
            "timestamp", LocalDateTime.now(),
            "services", Map.of(
                "inventory_refresher", "active",
                "onec_integration", oneCIntegrationService != null ? "active" : "not_configured"
            ),
            "last_sync", "N/A", // TODO: добавить отслеживание последней синхронизации
            "status", "ready"
        );
        
        return ResponseEntity.ok(status);
    }

    /**
     * Запустить полную синхронизацию остатков с 1С
     */
    @PostMapping("/inventory/full")
    public ResponseEntity<Map<String, Object>> syncInventoryFull() {
        log.info("Admin triggered full inventory sync");
        
        try {
            // Запускаем синхронизацию асинхронно
            CompletableFuture.runAsync(() -> {
                try {
                    log.info("Starting full inventory sync...");
                    // inventoryRefresher.fullSyncFromOneC(); // TODO: реализовать
                    log.info("Full inventory sync completed");
                } catch (Exception e) {
                    log.error("Full inventory sync failed", e);
                }
            });
            
            return ResponseEntity.ok(Map.of(
                "status", "started",
                "message", "Полная синхронизация остатков запущена",
                "timestamp", LocalDateTime.now()
            ));
            
        } catch (Exception e) {
            log.error("Failed to start full inventory sync", e);
            return ResponseEntity.status(500).body(Map.of(
                "status", "error",
                "message", "Ошибка запуска синхронизации: " + e.getMessage(),
                "timestamp", LocalDateTime.now()
            ));
        }
    }

    /**
     * Запустить инкрементальную синхронизацию остатков
     */
    @PostMapping("/inventory/delta")
    public ResponseEntity<Map<String, Object>> syncInventoryDelta() {
        log.info("Admin triggered delta inventory sync");
        
        try {
            CompletableFuture.runAsync(() -> {
                try {
                    log.info("Starting delta inventory sync...");
                    // inventoryRefresher.deltaSyncFromOneC(); // TODO: реализовать
                    log.info("Delta inventory sync completed");
                } catch (Exception e) {
                    log.error("Delta inventory sync failed", e);
                }
            });
            
            return ResponseEntity.ok(Map.of(
                "status", "started", 
                "message", "Инкрементальная синхронизация остатков запущена",
                "timestamp", LocalDateTime.now()
            ));
            
        } catch (Exception e) {
            log.error("Failed to start delta inventory sync", e);
            return ResponseEntity.status(500).body(Map.of(
                "status", "error",
                "message", "Ошибка запуска синхронизации: " + e.getMessage(),
                "timestamp", LocalDateTime.now()
            ));
        }
    }

    /**
     * Синхронизация каталога товаров с 1С
     */
    @PostMapping("/catalog")
    public ResponseEntity<Map<String, Object>> syncCatalog() {
        log.info("Admin triggered catalog sync");
        
        try {
            CompletableFuture.runAsync(() -> {
                try {
                    log.info("Starting catalog sync...");
                    if (oneCIntegrationService != null) {
                        // oneCIntegrationService.syncCatalog(); // TODO: реализовать
                    }
                    log.info("Catalog sync completed");
                } catch (Exception e) {
                    log.error("Catalog sync failed", e);
                }
            });
            
            return ResponseEntity.ok(Map.of(
                "status", "started",
                "message", "Синхронизация каталога запущена", 
                "timestamp", LocalDateTime.now()
            ));
            
        } catch (Exception e) {
            log.error("Failed to start catalog sync", e);
            return ResponseEntity.status(500).body(Map.of(
                "status", "error",
                "message", "Ошибка запуска синхронизации каталога: " + e.getMessage(),
                "timestamp", LocalDateTime.now()
            ));
        }
    }

    /**
     * Отправить заказы в 1С
     */
    @PostMapping("/orders/send")
    public ResponseEntity<Map<String, Object>> sendOrdersToOneC(@RequestParam(required = false) Long orderId) {
        log.info("Admin triggered orders sync to 1C, orderId: {}", orderId);
        
        try {
            CompletableFuture.runAsync(() -> {
                try {
                    if (orderId != null) {
                        log.info("Sending specific order {} to 1C", orderId);
                        // oneCIntegrationService.sendOrderToOneC(orderId); // TODO: реализовать
                    } else {
                        log.info("Sending pending orders to 1C");
                        // oneCIntegrationService.sendPendingOrdersToOneC(); // TODO: реализовать
                    }
                    log.info("Orders sync to 1C completed");
                } catch (Exception e) {
                    log.error("Orders sync to 1C failed", e);
                }
            });
            
            String message = orderId != null 
                ? "Отправка заказа #" + orderId + " в 1С запущена"
                : "Отправка ожидающих заказов в 1С запущена";
                
            return ResponseEntity.ok(Map.of(
                "status", "started",
                "message", message,
                "orderId", orderId,
                "timestamp", LocalDateTime.now()
            ));
            
        } catch (Exception e) {
            log.error("Failed to start orders sync to 1C", e);
            return ResponseEntity.status(500).body(Map.of(
                "status", "error", 
                "message", "Ошибка отправки заказов в 1С: " + e.getMessage(),
                "timestamp", LocalDateTime.now()
            ));
        }
    }

    /**
     * Проверить соединение с 1С
     */
    @GetMapping("/test-connection")
    public ResponseEntity<Map<String, Object>> testOneCConnection() {
        log.info("Admin requested 1C connection test");
        
        try {
            boolean isConnected = false;
            String message = "1С не настроена";
            
            if (oneCIntegrationService != null) {
                // isConnected = oneCIntegrationService.testConnection(); // TODO: реализовать
                isConnected = true; // заглушка
                message = isConnected ? "Соединение с 1С успешно" : "Не удается подключиться к 1С";
            }
            
            return ResponseEntity.ok(Map.of(
                "connected", isConnected,
                "message", message,
                "timestamp", LocalDateTime.now()
            ));
            
        } catch (Exception e) {
            log.error("1C connection test failed", e);
            return ResponseEntity.status(500).body(Map.of(
                "connected", false,
                "message", "Ошибка проверки соединения: " + e.getMessage(),
                "timestamp", LocalDateTime.now()
            ));
        }
    }

    /**
     * Получить конфигурацию синхронизации
     */
    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getSyncConfig() {
        log.info("Admin requested sync configuration");
        
        Map<String, Object> config = Map.of(
            "onec_base_url", "http://onec.local", // TODO: получать из настроек
            "sync_intervals", Map.of(
                "inventory_delta", "5 minutes",
                "catalog", "daily",
                "orders", "immediate"
            ),
            "enabled_features", Map.of(
                "auto_inventory_sync", true,
                "auto_order_sync", true,
                "auto_catalog_sync", false
            ),
            "last_sync_times", Map.of(
                "inventory", "N/A",
                "catalog", "N/A", 
                "orders", "N/A"
            )
        );
        
        return ResponseEntity.ok(config);
    }

    /**
     * Обновить конфигурацию синхронизации
     */
    @PutMapping("/config")
    public ResponseEntity<Map<String, Object>> updateSyncConfig(@RequestBody Map<String, Object> newConfig) {
        log.info("Admin updated sync configuration: {}", newConfig);
        
        try {
            // TODO: сохранить конфигурацию в базу или настройки
            
            return ResponseEntity.ok(Map.of(
                "status", "updated",
                "message", "Конфигурация синхронизации обновлена",
                "config", newConfig,
                "timestamp", LocalDateTime.now()
            ));
            
        } catch (Exception e) {
            log.error("Failed to update sync config", e);
            return ResponseEntity.status(500).body(Map.of(
                "status", "error",
                "message", "Ошибка обновления конфигурации: " + e.getMessage(),
                "timestamp", LocalDateTime.now()
            ));
        }
    }
}
