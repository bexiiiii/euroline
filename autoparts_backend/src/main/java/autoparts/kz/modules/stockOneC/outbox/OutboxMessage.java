package autoparts.kz.modules.stockOneC.outbox;



import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "order_outbox", indexes = {
        @Index(name = "idx_outbox_status", columnList = "status")
})
@Data
public class OutboxMessage {

    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();

    @Column(nullable = false, length = 64)
    private String aggregateType; // "Order"

    @Column(nullable = false)
    private Long aggregateId;     // order.id

    @Column(nullable = false, length = 64)
    private String eventType;     // "OrderCreated"

    @Lob
    @Column(nullable = false)
    private String payloadJson;   // JSON события

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Status status = Status.NEW; // NEW, SENT, FAILED

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Status { NEW, SENT, FAILED }
}
