package autoparts.kz.modules.admin.Events.repository;

import autoparts.kz.modules.admin.Events.entity.EventLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface EventLogRepository extends JpaRepository<EventLog, Long>, JpaSpecificationExecutor<EventLog> {
    
    @Query("SELECT DISTINCT el.eventType FROM EventLog el WHERE el.eventType IS NOT NULL ORDER BY el.eventType")
    List<String> findDistinctEventTypes();
}
