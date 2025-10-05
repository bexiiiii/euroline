package autoparts.kz.modules.admin.api.dto;

import java.time.Instant;

public record ApiKeyRequestLogResponse(
        Long id,
        Instant requestedAt,
        String requestPath,
        String requestMethod,
        Integer responseStatus,
        String clientIp
) {}
