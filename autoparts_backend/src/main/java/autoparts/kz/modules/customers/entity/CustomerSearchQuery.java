package autoparts.kz.modules.customers.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name="customer_search_history")
@Getter
@Setter
public class CustomerSearchQuery {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private Long customerId;
    private String query;
    private Instant createdAt;
    @PrePersist void t(){ createdAt = Instant.now(); }
}