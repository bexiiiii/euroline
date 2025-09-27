package autoparts.kz.modules.notifications.entity;



import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "notifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    private Long userId;

    private String title;

    @Column(length = 4000)
    private String body;

    @Enumerated(EnumType.STRING)
    private Type type;        // ORDER, RETURN, SYSTEM, FINANCE, CART, PROMO

    @Enumerated(EnumType.STRING)
    private Severity severity; // INFO, SUCCESS, WARNING, ERROR

    private boolean readFlag;

    private Instant createdAt;

    @PrePersist void pre() { createdAt = Instant.now(); }

    public enum Type { ORDER, RETURN, SYSTEM, FINANCE, CART, PROMO }
    public enum Severity { INFO, SUCCESS, WARNING, ERROR }
}
