package autoparts.kz.modules.admin.settings.controller;

import autoparts.kz.modules.admin.Events.service.EventLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.actuate.health.HealthEndpoint;
import org.springframework.boot.actuate.metrics.MetricsEndpoint;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;

@RestController
@RequestMapping("/api/admin/system") 
@RequiredArgsConstructor
public class AdminSystemController {
    private final HealthEndpoint healthEndpoint;
    private final MetricsEndpoint metricsEndpoint;
    private final EventLogService eventLogService;
    private final AtomicBoolean maintenanceMode = new AtomicBoolean(false);

    @GetMapping("/status") 
    @PreAuthorize("hasRole('ADMIN')")
    public Object status(){ 
        return healthEndpoint.health(); 
    }

    @GetMapping("/services") 
    @PreAuthorize("hasRole('ADMIN')")
    public Object services(){ 
        return healthEndpoint.health(); 
    }

    @GetMapping("/metrics") 
    @PreAuthorize("hasRole('ADMIN')")
    public Object metrics(){ 
        return metricsEndpoint.listNames(); 
    }

    @PostMapping("/restart") 
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String,Object> restart(){ 
        eventLogService.logSystemRestart();
        /* вставь graceful-restart хук или деплой‑скрипт */ 
        return Map.of(
                "accepted", true,
                "timestamp", Instant.now().toEpochMilli()
        ); 
    }
    
    @PostMapping("/backup") 
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String,Object> backup(){ 
        eventLogService.logSystemBackup();
        String backupId = UUID.randomUUID().toString();
        /* вставь скрипт создания бэкапа */ 
        return Map.of(
                "accepted", true,
                "message", "Backup initiated",
                "backupId", backupId,
                "timestamp", Instant.now().toEpochMilli()
        ); 
    }

    @GetMapping("/health") 
    public Object health(){ 
        return status(); 
    }

    @PostMapping("/diagnostics")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> runDiagnostics() {
        eventLogService.logAdminAction("SYSTEM_DIAGNOSTICS", "Запущена полная диагностика системы");
        return Map.of(
                "status", "COMPLETED",
                "timestamp", Instant.now().toEpochMilli(),
                "health", healthEndpoint.health(),
                "metrics", metricsEndpoint.listNames()
        );
    }

    @GetMapping("/maintenance")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> maintenanceStatus() {
        return Map.of(
                "enabled", maintenanceMode.get(),
                "timestamp", Instant.now().toEpochMilli()
        );
    }

    @PostMapping("/maintenance")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> toggleMaintenance(@RequestParam("enabled") boolean enabled) {
        maintenanceMode.set(enabled);
        eventLogService.logAdminAction(
                "SYSTEM_MAINTENANCE",
                enabled ? "Включен режим обслуживания" : "Выключен режим обслуживания"
        );
        return maintenanceStatus();
    }
}
