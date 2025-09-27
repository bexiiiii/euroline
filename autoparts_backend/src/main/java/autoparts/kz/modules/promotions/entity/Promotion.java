package autoparts.kz.modules.promotions.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name="promotions")
@Getter
@Setter
public class Promotion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private String title; private String description;
    private Instant startsAt; private Instant endsAt;
    private String status; // ACTIVE/INACTIVE
    private Instant createdAt; @PrePersist void t(){ createdAt = Instant.now(); }
}