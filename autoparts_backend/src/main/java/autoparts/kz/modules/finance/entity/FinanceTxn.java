package autoparts.kz.modules.finance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name="finance_txn")
@Getter
@Setter
public class FinanceTxn {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private Long clientId;
    private String type;
    private BigDecimal amount;
    private String description;
    private Instant createdAt; @PrePersist void t(){ createdAt = Instant.now(); }
}