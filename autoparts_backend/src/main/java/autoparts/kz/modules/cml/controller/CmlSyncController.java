package autoparts.kz.modules.cml.controller;

import autoparts.kz.modules.cml.service.ProductSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * API для ручной синхронизации данных из CommerceML (1С)
 */
@RestController
@RequestMapping("/api/admin/cml")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class CmlSyncController {

    private final ProductSyncService productSyncService;

    /**
     * Принудительная синхронизация цен и остатков для всех товаров
     * 
     * GET /api/admin/cml/sync-prices
     * 
     * Обновляет цены и остатки в таблице products из cml_prices и cml_stocks
     * на основе external_code (guid товара из 1С)
     */
    @PostMapping("/sync-prices")
    public ResponseEntity<Map<String, Object>> syncPrices() {
        log.info("🔄 Admin triggered manual price synchronization");
        
        try {
            int updatedCount = productSyncService.syncProductsFromCml();
            
            log.info("✅ Manual price sync completed: {} products updated", updatedCount);
            
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Синхронизация цен и остатков завершена",
                "productsUpdated", updatedCount,
                "timestamp", LocalDateTime.now()
            ));
            
        } catch (Exception e) {
            log.error("❌ Manual price sync failed", e);
            
            return ResponseEntity.status(500).body(Map.of(
                "status", "error",
                "message", "Ошибка синхронизации: " + e.getMessage(),
                "timestamp", LocalDateTime.now()
            ));
        }
    }

    /**
     * Полная синхронизация: товары + свойства + цены
     * 
     * POST /api/admin/cml/sync-full
     */
    @PostMapping("/sync-full")
    public ResponseEntity<Map<String, Object>> syncFull() {
        log.info("🔄 Admin triggered full synchronization");
        
        try {
            int productsCount = productSyncService.fullSync();
            
            log.info("✅ Full sync completed: {} products", productsCount);
            
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Полная синхронизация завершена",
                "productsUpdated", productsCount,
                "timestamp", LocalDateTime.now()
            ));
            
        } catch (Exception e) {
            log.error("❌ Full sync failed", e);
            
            return ResponseEntity.status(500).body(Map.of(
                "status", "error",
                "message", "Ошибка синхронизации: " + e.getMessage(),
                "timestamp", LocalDateTime.now()
            ));
        }
    }

    /**
     * Получить статус синхронизации
     * 
     * GET /api/admin/cml/sync-status
     */
    @GetMapping("/sync-status")
    public ResponseEntity<Map<String, Object>> getSyncStatus() {
        log.info("📊 Admin requested sync status");
        
        // TODO: Добавить реальные метрики из базы данных
        
        return ResponseEntity.ok(Map.of(
            "status", "ready",
            "message", "Система готова к синхронизации",
            "timestamp", LocalDateTime.now(),
            "availableOperations", Map.of(
                "syncPrices", "POST /api/admin/cml/sync-prices - Синхронизация цен и остатков",
                "syncFull", "POST /api/admin/cml/sync-full - Полная синхронизация"
            )
        ));
    }
}
