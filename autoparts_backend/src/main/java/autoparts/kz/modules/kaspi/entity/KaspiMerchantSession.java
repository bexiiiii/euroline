package autoparts.kz.modules.kaspi.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/**
 * The single Kaspi Pay cashier session (row id = 1) the admin connected via SMS login.
 * vtokenSecret is already AES-GCM encrypted by the sidecar (key lives only in the sidecar env);
 * never expose tokenSn / vtokenSecret outside the backend.
 */
@Entity
@Table(name = "kaspi_merchant_session")
@Getter
@Setter
public class KaspiMerchantSession {
    public static final long SINGLETON_ID = 1L;

    public enum Status { DISCONNECTED, CONNECTED, EXPIRED }

    @Id
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Status status = Status.DISCONNECTED;

    @Column(name = "token_sn")
    private String tokenSn;
    @Column(name = "vtoken_secret", columnDefinition = "TEXT")
    private String vtokenSecret;
    @Column(name = "profile_id", length = 64)
    private String profileId;
    @Column(name = "organization_id", length = 64)
    private String organizationId;
    @Column(name = "org_name", length = 512)
    private String orgName;
    @Column(length = 32)
    private String phone;
    @Column(name = "last_error", length = 1024)
    private String lastError;
    @Column(name = "connected_at")
    private Instant connectedAt;
    @Column(name = "last_checked_at")
    private Instant lastCheckedAt;
    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void touch() { updatedAt = Instant.now(); }

    public boolean isUsable() {
        return status == Status.CONNECTED && tokenSn != null && vtokenSecret != null;
    }
}
