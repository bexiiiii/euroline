package autoparts.kz.modules.admin.api.dto;

import java.time.Instant;

public record ApiKeyResponse(
        Long id,
        String name,
        String description,
        boolean active,
        Instant createdAt,
        String createdBy,
        Instant expiresAt,
        Instant lastUsedAt,
        String lastUsedIp,
        Long requestCount,
        Instant revokedAt
) {}
