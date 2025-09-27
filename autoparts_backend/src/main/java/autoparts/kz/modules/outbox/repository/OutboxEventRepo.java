package autoparts.kz.modules.outbox.repository;


import autoparts.kz.modules.outbox.entity.OutboxEvent;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

import java.util.List;

public interface OutboxEventRepo extends JpaRepository<OutboxEvent, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from OutboxEvent e where e.status='NEW' order by e.id asc")
    List<OutboxEvent> findBatch(Pageable pageable);
}