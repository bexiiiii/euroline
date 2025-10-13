package autoparts.kz.modules.system.controller;

import autoparts.kz.modules.admin.settings.service.MaintenanceModeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/system")
@RequiredArgsConstructor
public class SystemMaintenanceController {

    private final MaintenanceModeService maintenanceModeService;

    @GetMapping("/maintenance")
    public Map<String, Object> maintenanceStatus() {
        return maintenanceModeService.statusPayload();
    }
}
