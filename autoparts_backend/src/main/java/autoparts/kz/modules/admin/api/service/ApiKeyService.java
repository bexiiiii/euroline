package autoparts.kz.modules.admin.api.service;

import autoparts.kz.modules.admin.api.dto.ApiKeyCreationResponse;
import autoparts.kz.modules.admin.api.dto.ApiKeyMetricsResponse;
import autoparts.kz.modules.admin.api.dto.ApiKeyRequestLogResponse;
import autoparts.kz.modules.admin.api.dto.ApiKeyResponse;
import autoparts.kz.modules.admin.api.entity.ApiKey;
import autoparts.kz.modules.admin.api.entity.ApiKeyRequestLog;
import autoparts.kz.modules.admin.api.repository.ApiKeyRepository;
import autoparts.kz.modules.admin.api.repository.ApiKeyRequestLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ApiKeyService {

    private final ApiKeyRepository apiKeyRepository;
    private final ApiKeyRequestLogRepository requestLogRepository;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    private static final ZoneId UTC = ZoneId.of("UTC");

    @Transactional
    public ApiKeyCreationResponse create(String name, String description, String createdBy) {
        String rawKey = generateRawKey();

        ApiKey apiKey = new ApiKey();
        apiKey.setName(name);
        apiKey.setDescription(description);
        apiKey.setCreatedBy(createdBy);
        apiKey.setActive(true);
        apiKey.setRequestCount(0L);
        apiKey.setKeyHash(encoder.encode(rawKey));

        apiKeyRepository.save(apiKey);
        return new ApiKeyCreationResponse(apiKey.getId(), rawKey);
    }

    @Transactional
    public ApiKeyCreationResponse rotate(Long id) {
        ApiKey apiKey = apiKeyRepository.findById(id).orElseThrow();
        String rawKey = generateRawKey();
        apiKey.setKeyHash(encoder.encode(rawKey));
        apiKey.setActive(true);
        apiKey.setRevokedAt(null);
        apiKey.setLastUsedAt(null);
        apiKey.setLastUsedIp(null);
        apiKey.setRequestCount(0L);
        apiKeyRepository.save(apiKey);
        return new ApiKeyCreationResponse(apiKey.getId(), rawKey);
    }

    @Transactional
    public ApiKey update(Long id, String name, String description, Boolean active) {
        ApiKey apiKey = apiKeyRepository.findById(id).orElseThrow();
        if (name != null) {
            apiKey.setName(name);
        }
        if (description != null) {
            apiKey.setDescription(description);
        }
        if (active != null && apiKey.isActive() != active) {
            apiKey.setActive(active);
            apiKey.setRevokedAt(active ? null : Instant.now());
        }
        return apiKeyRepository.save(apiKey);
    }

    @Transactional
    public void revoke(Long id) {
        ApiKey apiKey = apiKeyRepository.findById(id).orElseThrow();
        apiKey.setActive(false);
        apiKey.setRevokedAt(Instant.now());
        apiKeyRepository.save(apiKey);
    }

    @Transactional
    public void recordUsage(ApiKey apiKey, String path, String method, int status, String clientIp) {
        ApiKey managed = apiKeyRepository.findById(apiKey.getId()).orElseThrow();
        managed.setLastUsedAt(Instant.now());
        managed.setLastUsedIp(clientIp);
        managed.setRequestCount(Optional.ofNullable(managed.getRequestCount()).orElse(0L) + 1);
        apiKeyRepository.save(managed);

        ApiKeyRequestLog log = new ApiKeyRequestLog();
        log.setApiKey(managed);
        log.setRequestPath(path);
        log.setRequestMethod(method);
        log.setResponseStatus(status);
        log.setClientIp(clientIp);
        requestLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public Optional<ApiKey> authenticate(String rawKey) {
        return apiKeyRepository.findByActiveTrue().stream()
                .filter(apiKey -> encoder.matches(rawKey, apiKey.getKeyHash()))
                .findFirst();
    }

    @Transactional(readOnly = true)
    public List<ApiKey> findAll() {
        return apiKeyRepository.findAll();
    }

    @Transactional(readOnly = true)
    public ApiKey findById(Long id) {
        return apiKeyRepository.findById(id).orElseThrow();
    }

    @Transactional(readOnly = true)
    public List<ApiKeyRequestLogResponse> lastRequests(Long keyId) {
        ApiKey apiKey = apiKeyRepository.findById(keyId).orElseThrow();
        return requestLogRepository.findTop20ByApiKeyOrderByRequestedAtDesc(apiKey)
                .stream()
                .map(this::toLogResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ApiKeyMetricsResponse metrics() {
        long total = apiKeyRepository.count();
        long active = apiKeyRepository.countByActiveTrue();
        long revoked = apiKeyRepository.countRevoked();
        Instant sevenDaysAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        Instant startOfToday = LocalDate.now(UTC).atStartOfDay(UTC).toInstant();

        long requestsToday = requestLogRepository.countByRequestedAtAfter(startOfToday);
        long requests7Days = requestLogRepository.countByRequestedAtAfter(sevenDaysAgo);
        long recentUsedKeys = apiKeyRepository.countRecentlyUsed(sevenDaysAgo);
        long errorCountToday = requestLogRepository.countErrorsSince(startOfToday);

        double uptime = requestsToday == 0
                ? 100.0
                : Math.max(0, (requestsToday - errorCountToday) * 100.0 / requestsToday);

        return new ApiKeyMetricsResponse(total, active, revoked, recentUsedKeys, requestsToday, requests7Days, errorCountToday, uptime);
    }

    public ApiKeyResponse toResponse(ApiKey apiKey) {
        return new ApiKeyResponse(
                apiKey.getId(),
                apiKey.getName(),
                apiKey.getDescription(),
                apiKey.isActive(),
                apiKey.getCreatedAt(),
                apiKey.getCreatedBy(),
                apiKey.getExpiresAt(),
                apiKey.getLastUsedAt(),
                apiKey.getLastUsedIp(),
                Optional.ofNullable(apiKey.getRequestCount()).orElse(0L),
                apiKey.getRevokedAt()
        );
    }

    private ApiKeyRequestLogResponse toLogResponse(ApiKeyRequestLog log) {
        return new ApiKeyRequestLogResponse(
                log.getId(),
                log.getRequestedAt(),
                log.getRequestPath(),
                log.getRequestMethod(),
                log.getResponseStatus(),
                log.getClientIp()
        );
    }

    private String generateRawKey() {
        return UUID.randomUUID().toString().replace("-", "");
    }
}
