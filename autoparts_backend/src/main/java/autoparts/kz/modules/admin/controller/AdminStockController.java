package autoparts.kz.modules.admin.controller;


import autoparts.kz.modules.stockOneC.service.InventoryOnDemandRefresher;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/stock")
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "integration.kafka", name = "enabled", havingValue = "true")
public class AdminStockController {
    private final InventoryOnDemandRefresher stockUpdateScheduler;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/sync-now")
    public ResponseEntity<?> syncNow() {
//        stockUpdateScheduler.updateStockFrom1C();
        return ResponseEntity.ok("🟢 Sync with 1C triggered manually.");
    }
}
