package autoparts.kz.modules.admin.Events.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.Instant;

@Entity
@Table(name="event_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EventLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String eventType;
    private String entityType;
    private Long entityId;
    private Long userId;
    private String userName;
    private String description;
    private String details;
    private String ipAddress;
    private String userAgent;
    private Boolean success;
    private String errorMessage;
    private String sessionId;
    
    private Instant createdAt;
    
    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (success == null) {
            success = true;
        }
    }
}
