package autoparts.kz.modules.promotions.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name="banners")
@Getter
@Setter
public class Banner {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private String title; private String imageUrl; private String linkUrl; private String status; // ACTIVE/INACTIVE
    private Instant createdAt; @PrePersist void t(){ createdAt = Instant.now(); }
}