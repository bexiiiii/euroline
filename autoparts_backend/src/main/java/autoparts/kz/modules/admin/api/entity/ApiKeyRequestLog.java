package autoparts.kz.modules.admin.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "api_key_request_log")
@Getter
@Setter
public class ApiKeyRequestLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "api_key_id")
    private ApiKey apiKey;

    @Column(name = "requested_at", nullable = false)
    private Instant requestedAt = Instant.now();

    @Column(name = "request_path", length = 512)
    private String requestPath;

    @Column(name = "request_method", length = 16)
    private String requestMethod;

    @Column(name = "response_status")
    private Integer responseStatus;

    @Column(name = "client_ip", length = 64)
    private String clientIp;
}
