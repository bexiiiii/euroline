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
    public enum Status { PENDING, APPROVED, REJECTED }
}
