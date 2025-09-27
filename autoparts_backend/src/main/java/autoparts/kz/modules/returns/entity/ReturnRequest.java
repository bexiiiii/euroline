package autoparts.kz.modules.returns.entity;

import autoparts.kz.modules.returns.status.ReturnStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

// entity/ReturnRequest.java
@Entity
@Table(name = "return_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReturnRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long orderId;
    private Long customerId;
    private String reason;
    @Enumerated(EnumType.STRING)
    private ReturnStatus status;
    @Column(precision = 19, scale = 2)
    private java.math.BigDecimal amount;
    @Column(name = "details_json")
    private String detailsJson;
    private Instant createdAt;
    private Instant updatedAt;
    @PrePersist void pre() { createdAt = updatedAt = Instant.now(); }
    @PreUpdate void upd() { updatedAt = Instant.now(); }

}
