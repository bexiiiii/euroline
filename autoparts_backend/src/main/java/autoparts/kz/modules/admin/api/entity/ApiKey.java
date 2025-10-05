package autoparts.kz.modules.admin.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "api_keys")
@Getter
@Setter
public class ApiKey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String description;

    @Column(name = "key_hash", nullable = false)
    private String keyHash;

    @Column(name = "active")
    private boolean active = true;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "last_used_at")
    private Instant lastUsedAt;

    @Column(name = "last_used_ip")
    private String lastUsedIp;

    @Column(name = "request_count")
    private Long requestCount = 0L;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (requestCount == null) {
            requestCount = 0L;
        }
    }

    @PreUpdate
    void onUpdate() {
        if (requestCount == null) {
            requestCount = 0L;
        }
    }
}
