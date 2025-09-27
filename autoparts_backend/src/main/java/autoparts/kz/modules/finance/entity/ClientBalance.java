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
    private Instant updatedAt;
    @PrePersist
    @PreUpdate
    void t(){ updatedAt = Instant.now(); }
}