package autoparts.kz.modules.admin.api.controller;

import autoparts.kz.modules.admin.Events.service.EventLogService;
import autoparts.kz.modules.admin.api.entity.ApiKey;
import autoparts.kz.modules.admin.api.repository.ApiKeyRepository;
import autoparts.kz.modules.admin.api.service.ApiKeyService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/api/keys") 
@RequiredArgsConstructor
public class AdminApiKeysController {
    private final ApiKeyService svc;
    private final ApiKeyRepository repo;
    private final EventLogService eventLogService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<ApiKey> list(){ return repo.findAll(); }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String,String> create(@RequestParam String name){ 
        Map<String,String> result = svc.create(name);
        eventLogService.logApiKeyCreated(Long.parseLong(result.get("id")), name);
        return result;
    }

    @DeleteMapping("/{id}") 
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String,Object> revoke(@PathVariable Long id){ 
        // Get the key name before revoking
        String keyName = repo.findById(id).map(ApiKey::getName).orElse("Unknown");
        svc.revoke(id); 
        eventLogService.logApiKeyRevoked(id, keyName);
        return Map.of("revoked", true); 
    }
}