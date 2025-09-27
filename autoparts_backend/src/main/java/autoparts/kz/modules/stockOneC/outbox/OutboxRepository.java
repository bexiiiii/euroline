package autoparts.kz.modules.stockOneC.outbox;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OutboxRepository extends JpaRepository<OutboxMessage, String> {
    List<OutboxMessage> findTop100ByStatusOrderByCreatedAtAsc(OutboxMessage.Status status);
}