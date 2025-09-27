package autoparts.kz.modules.admin.UserActivity.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name="user_activity") @Getter
@Setter
public class UserActivity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private Long userId; private String action; private String details;
    private Instant createdAt; @PrePersist void t(){ createdAt = Instant.now(); }
}
