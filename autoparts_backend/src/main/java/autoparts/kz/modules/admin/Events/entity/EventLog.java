package autoparts.kz.modules.admin.Events.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name="event_logs") @Getter
@Setter
public class EventLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private String type; private String payload;
    private Instant createdAt; @PrePersist void t(){ createdAt = Instant.now(); }
}
