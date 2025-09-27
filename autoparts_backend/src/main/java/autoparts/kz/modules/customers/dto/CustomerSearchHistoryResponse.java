package autoparts.kz.modules.customers.dto;

import java.time.Instant;

public record CustomerSearchHistoryResponse(
        Long id,
        Long customerId,
        String clientName,
        String query,
        Instant createdAt
) {}
