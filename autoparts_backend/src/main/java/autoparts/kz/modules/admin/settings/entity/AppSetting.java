package autoparts.kz.modules.admin.settings.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name="app_settings") @Getter
@Setter
public class AppSetting {
    @Id
    @Column(name = "cfg_key")
    private String key;
    @Column(name = "cfg_value", length=4000)
    private String value;
    @Column(name = "updated_at")
    private Instant updatedAt;
    @PrePersist
    @PreUpdate void t(){ updatedAt = Instant.now(); }
}