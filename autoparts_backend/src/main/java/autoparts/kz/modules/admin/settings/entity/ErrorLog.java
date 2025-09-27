package autoparts.kz.modules.admin.settings.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name="error_logs") @Getter
@Setter
public class ErrorLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private String level; // ERROR/WARN
    private String message;
    @Column(length=8000) private String stacktrace;
    private boolean resolved;
    private Instant createdAt; @PrePersist void t(){ createdAt = Instant.now(); }
}
