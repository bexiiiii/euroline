package autoparts.kz.modules.admin.Events.events;


import java.time.Instant;

public record OrderEvent(
        String type,        // CREATED, CANCELLED, CONFIRMED, FAILED, REFUNDED
        Long orderId,
        Long userId,
        String payload,     // опционально: причина отмены, сумма,
        Instant createdAt
) {}