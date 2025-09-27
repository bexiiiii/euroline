package autoparts.kz.modules.outbox.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;

@Entity @Table(name="outbox_event")
@Data
public class OutboxEvent {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    private String topic;
    private String key;
    @Lob private String payload;
    private Instant createdAt = Instant.now();
    private String status = "NEW"; // NEW,SENT,ERROR
    private int attempts;
}
