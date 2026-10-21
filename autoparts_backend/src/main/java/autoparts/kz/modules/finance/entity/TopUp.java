package autoparts.kz.modules.finance.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name="top_ups")
@Data
public class TopUp {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private Long clientId;
    private BigDecimal amount;
    @Enumerated(EnumType.STRING) private Status status;
    private Instant createdAt; @PrePersist void t(){ createdAt = Instant.now(); }
    private String receiptUrl; // ссылка на загруженный чек (image/pdf)

    @Column(length = 64)
    private String paymentMethod;

    @Column(length = 1024)
    private String adminComment;

    // Kaspi Pay (filled only for top-ups created via Kaspi invoice / QR; see modules.kaspi)
    @Column(name = "kaspi_type", length = 16)
    private String kaspiType;
    @Column(name = "kaspi_operation_id")
    private Long kaspiOperationId;
    @Column(name = "kaspi_status", length = 64)
    private String kaspiStatus;
    @Column(name = "kaspi_phone", length = 20)
    private String kaspiPhone;
    @Column(name = "kaspi_qr_token", length = 1024)
    private String kaspiQrToken;
    @Column(name = "kaspi_expires_at")
    private Instant kaspiExpiresAt;
    @Column(name = "kaspi_checked_at")
    private Instant kaspiCheckedAt;
    public enum Status { PENDING, APPROVED, REJECTED }
}
