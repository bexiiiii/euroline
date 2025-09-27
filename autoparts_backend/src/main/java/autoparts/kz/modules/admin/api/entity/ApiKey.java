package autoparts.kz.modules.admin.api.entity;

import jakarta.persistence.*;

@Entity
@Table(name="api_keys")
@lombok.Getter @lombok.Setter
public class ApiKey {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private String name;          // для кого ключ
    private String keyHash;       // BCrypt
    private boolean active = true;
    private java.time.Instant createdAt;
    @PrePersist void t(){ createdAt = java.time.Instant.now(); }
}
