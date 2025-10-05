package autoparts.kz.modules.admin.api.dto;

public record ApiKeyMetricsResponse(
        long totalKeys,
        long activeKeys,
        long revokedKeys,
        long recentlyUsedKeys,
        long requestsToday,
        long requests7Days,
        long errorCountToday,
        double uptimePercentage
) {}
