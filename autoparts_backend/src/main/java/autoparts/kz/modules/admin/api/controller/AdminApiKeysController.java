package autoparts.kz.modules.admin.api.controller;

import autoparts.kz.modules.admin.Events.service.EventLogService;
import autoparts.kz.modules.admin.api.dto.*;
import autoparts.kz.modules.admin.api.entity.ApiKey;
import autoparts.kz.modules.admin.api.service.ApiKeyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/api/keys")
@RequiredArgsConstructor
@Validated
@PreAuthorize("hasRole('ADMIN')")
public class AdminApiKeysController {

    private final ApiKeyService apiKeyService;
    private final EventLogService eventLogService;

    @GetMapping
    public List<ApiKeyResponse> list() {
        return apiKeyService.findAll().stream()
                .map(apiKeyService::toResponse)
                .toList();
    }

    @GetMapping("/metrics")
    public ApiKeyMetricsResponse metrics() {
        return apiKeyService.metrics();
    }

    @GetMapping("/{id}/logs")
    public List<ApiKeyRequestLogResponse> lastRequests(@PathVariable Long id) {
        return apiKeyService.lastRequests(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiKeyCreationResponse create(@RequestBody @Validated CreateApiKeyRequest request) {
        String actor = resolveActor(request.createdBy());
        ApiKeyCreationResponse response = apiKeyService.create(request.name(), request.description(), actor);
        eventLogService.logApiKeyCreated(response.id(), request.name());
        return response;
    }

    @PostMapping("/{id}/rotate")
    public ApiKeyCreationResponse rotate(@PathVariable Long id) {
        ApiKey apiKey = apiKeyService.findById(id);
        ApiKeyCreationResponse response = apiKeyService.rotate(id);
        eventLogService.logAdminAction("ROTATE_API_KEY", "Перегенерирован ключ: " + apiKey.getName());
        return response;
    }

    @PatchMapping("/{id}")
    public ApiKeyResponse update(@PathVariable Long id, @RequestBody @Validated UpdateApiKeyRequest request) {
        ApiKey updated = apiKeyService.update(id, request.name(), request.description(), request.active());
        eventLogService.logAdminAction("UPDATE_API_KEY", "Обновлён ключ: " + updated.getName());
        return apiKeyService.toResponse(updated);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revoke(@PathVariable Long id) {
        ApiKey apiKey = apiKeyService.findById(id);
        apiKeyService.revoke(id);
        eventLogService.logApiKeyRevoked(id, apiKey.getName());
    }

    private String resolveActor(String provided) {
        if (provided != null && !provided.isBlank()) {
            return provided;
        }
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : "system";
    }
}
