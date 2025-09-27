package autoparts.kz.modules.returns.dto;

import java.time.Instant;


public class ReturnDtos {
    public record Create(Long orderId, Long customerId, String reason) {}
    public record Response(Long id, Long orderId, Long customerId, String reason, String status, Instant createdAt, java.math.BigDecimal amount) {}
    public record PatchStatus(String status) {}
}
