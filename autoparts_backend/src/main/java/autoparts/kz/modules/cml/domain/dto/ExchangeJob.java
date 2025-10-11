package autoparts.kz.modules.cml.domain.dto;

import java.time.Instant;

public record ExchangeJob(
        String type,
        String filename,
        String objectKey,
        String requestId,
        Instant createdAt
) {
    public ExchangeJob withType(String newType) {
        return new ExchangeJob(newType, filename, objectKey, requestId, createdAt);
    }
}
