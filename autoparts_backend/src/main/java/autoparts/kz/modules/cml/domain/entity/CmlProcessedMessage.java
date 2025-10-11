package autoparts.kz.modules.cml.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "cml_processed_messages")
public class CmlProcessedMessage {

    @Id
    @Column(length = 128)
    private String id;

    @Column(name = "processed_at", nullable = false)
    private LocalDateTime processedAt;

    @Column(nullable = false)
    private String type;

    public CmlProcessedMessage() {
    }

    public CmlProcessedMessage(String id, LocalDateTime processedAt, String type) {
        this.id = id;
        this.processedAt = processedAt;
        this.type = type;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public LocalDateTime getProcessedAt() {
        return processedAt;
    }

    public void setProcessedAt(LocalDateTime processedAt) {
        this.processedAt = processedAt;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}
