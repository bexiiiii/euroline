package autoparts.kz.modules.finance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name="client_balances")
@Getter
@Setter
public class ClientBalance {
    @Id
    private Long clientId;
    private BigDecimal balance;
    @Column(name = "credit_limit", precision = 18, scale = 2)
    private BigDecimal creditLimit;
    @Column(name = "credit_used", precision = 18, scale = 2)
    private BigDecimal creditUsed;
    @Column(name = "qr_code_url")
    private String qrCodeUrl;
    @Column(name = "qr_code_key")
    private String qrCodeKey;
    private Instant updatedAt;
    @PrePersist
    @PreUpdate
    void t(){ updatedAt = Instant.now(); }
}
