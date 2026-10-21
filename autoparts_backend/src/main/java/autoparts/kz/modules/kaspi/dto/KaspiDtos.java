package autoparts.kz.modules.kaspi.dto;

import java.math.BigDecimal;
import java.time.Instant;

public class KaspiDtos {
    // ── admin: Kaspi cashier connection ──
    public record ConnectionStatus(boolean enabled, String status, String phone, String orgName,
                                   Instant connectedAt, Instant lastCheckedAt, String lastError) {}
    public record AuthInitResponse(String processId) {}
    public record SendPhoneRequest(String processId, String phone) {}
    public record SendPhoneResponse(boolean smsSent, String message, String errorCode) {}
    public record VerifyOtpRequest(String processId, String otp) {}

    // ── client: top-up ──
    public record Availability(boolean available, BigDecimal minAmount, BigDecimal maxAmount) {}
    public record CreateInvoiceRequest(BigDecimal amount, String phone) {}
    public record CreateQrRequest(BigDecimal amount) {}
    /**
     * status: PENDING | APPROVED | REJECTED (Euroline top-up status, the source of truth for the balance);
     * kaspiStatus: raw Kaspi status for display.
     */
    public record KaspiTopUpView(Long id, String type, BigDecimal amount, String status, String kaspiStatus,
                                 String phone, String qrToken, Instant expiresAt, Instant createdAt) {}

    public static class KaspiException extends RuntimeException {
        private final int httpStatus;
        public KaspiException(int httpStatus, String message) {
            super(message);
            this.httpStatus = httpStatus;
        }
        public int getHttpStatus() { return httpStatus; }
    }
}
