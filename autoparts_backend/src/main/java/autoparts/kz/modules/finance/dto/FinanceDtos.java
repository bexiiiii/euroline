package autoparts.kz.modules.finance.dto;


import java.math.BigDecimal;
import java.time.Instant;

public class FinanceDtos {
    public record TopUpCreate(Long clientId, BigDecimal amount, String paymentMethod, String adminComment) {}
    public record TopUpResponse(Long id,
                                Long clientId,
                                BigDecimal amount,
                                String status,
                                Instant createdAt,
                                String paymentMethod,
                                String receiptUrl,
                                String adminComment,
                                String clientName,
                                String clientEmail,
                                String clientPhone) {}
    public record PatchStatus(String status, String adminComment, String paymentMethod) {}
    public record BalanceAdjust(BigDecimal delta, String reason) {}
    public record BalanceResponse(Long clientId, BigDecimal balance, Instant updatedAt) {}
}
