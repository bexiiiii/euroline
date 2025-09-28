package autoparts.kz.modules.admin.settings.controller;

import autoparts.kz.modules.admin.Events.service.EventLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.actuate.health.HealthEndpoint;
import org.springframework.boot.actuate.metrics.MetricsEndpoint;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/system") 
@RequiredArgsConstructor
public class AdminSystemController {
    private final HealthEndpoint healthEndpoint;
    private final MetricsEndpoint metricsEndpoint;
    private final EventLogService eventLogService;

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
        return Map.of("accepted", true); 
    }
    
    @PostMapping("/backup") 
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String,Object> backup(){ 
        eventLogService.logSystemBackup();
        /* вставь скрипт создания бэкапа */ 
        return Map.of("accepted", true, "message", "Backup initiated"); 
    }

    @GetMapping("/health") 
    public Object health(){ 
        return status(); 
    }
}