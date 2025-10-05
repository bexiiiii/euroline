package autoparts.kz.modules.admin.settings.controller;

import autoparts.kz.modules.admin.Events.service.EventLogService;
import autoparts.kz.modules.admin.settings.dto.SettingUpdateRequest;
import autoparts.kz.modules.admin.settings.entity.AppSetting;
import autoparts.kz.modules.admin.settings.service.SettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/settings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminSettingsController {

    private final SettingsService settingsService;
    private final EventLogService eventLogService;

    @GetMapping
    public List<AppSetting> all() {
        settingsService.ensureDefaults();
        return settingsService.findAll();
    }

    @GetMapping("/{key}")
    public AppSetting get(@PathVariable String key) {
        settingsService.ensureDefaults();
        return settingsService.findByKey(key);
    }

    @PutMapping("/{key}")
    public AppSetting put(@PathVariable String key, @RequestBody Map<String, String> body) {
        String newValue = body.getOrDefault("value", "");
        String oldValue = settingsService.get(key, null);
        AppSetting saved = settingsService.save(key, newValue);
        eventLogService.logSettingsUpdate(key, oldValue, newValue);
        return saved;
    }

    @PutMapping("/bulk")
    public List<AppSetting> bulkUpdate(@RequestBody @Valid List<SettingUpdateRequest> requests) {
        return requests.stream()
                .map(request -> {
                    String key = request.key();
                    String value = request.value();
                    String oldValue = settingsService.get(key, null);
                    AppSetting saved = settingsService.save(key, value);
                    eventLogService.logSettingsUpdate(key, oldValue, value);
                    return saved;
                })
                .collect(Collectors.toList());
    }

    @PostMapping("/init")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> initializeDefaults() {
        settingsService.resetToDefaults();
        eventLogService.logAdminAction("RESET_SETTINGS", "Восстановлены настройки по умолчанию");
        return Map.of("message", "Default settings created", "count", settingsService.findAll().size());
    }
}
