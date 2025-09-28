package autoparts.kz.modules.admin.UserActivity.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.Instant;

@Entity
@Table(name="user_activity")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserActivity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long userId;
    private String userName;
    private String action;
    private String module;
    private String ipAddress;
    private String userAgent;
    private String status; // success, failed, warning
    private String details;
    
    private Instant createdAt;
    
    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (status == null) {
            status = "success";
        }
    }
}
