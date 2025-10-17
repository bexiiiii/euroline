package autoparts.kz.modules.cml.controller;

import autoparts.kz.modules.cml.service.ProductSyncService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/sync")
public class ProductSyncController {

    private final ProductSyncService productSyncService;

    public ProductSyncController(ProductSyncService productSyncService) {
        this.productSyncService = productSyncService;
    }

    /**
     * Полная синхронизация всех товаров, свойств и характеристик
     */
    @PostMapping("/full")
    public ResponseEntity<Map<String, Object>> fullSync() {
        int productCount = productSyncService.fullSync();
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", "Full synchronization completed",
            "productsProcessed", productCount
        ));
    }

    /**
     * Синхронизация только товаров (без свойств)
     */
    @PostMapping("/products")
    public ResponseEntity<Map<String, Object>> syncProducts() {
        int productCount = productSyncService.syncProductsFromCml();
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", "Products synchronized",
            "productsProcessed", productCount
        ));
    }

    /**
     * Синхронизация только свойств товаров
     */
    @PostMapping("/properties")
    public ResponseEntity<Map<String, Object>> syncProperties() {
        int propertyCount = productSyncService.syncProductProperties();
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", "Product properties synchronized",
            "propertiesProcessed", propertyCount
        ));
    }
}
