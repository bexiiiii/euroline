package autoparts.kz.modules.finance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name="refund_requests")
@Getter
@Setter
public class RefundRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private Long clientId;
    private Long orderId;
    private BigDecimal amount;
    @Enumerated(EnumType.STRING) private Status status;
    private Instant createdAt; @PrePersist void t(){ createdAt = Instant.now(); }

    @Column(length = 1024)
    private String adminComment;
    
    // ✅ Интеграция с 1C через CommerceML
    private Boolean sentTo1C = false;  // Флаг отправки в 1C
    private Instant sentTo1CAt;        // Дата отправки в 1C
    private String externalId;         // ID документа в 1C (после подтверждения)

    public enum Status { NEW, IN_REVIEW, APPROVED, REJECTED, DONE }
}
