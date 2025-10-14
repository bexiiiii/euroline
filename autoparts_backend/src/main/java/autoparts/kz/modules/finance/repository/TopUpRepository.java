package autoparts.kz.modules.finance.repository;

import autoparts.kz.modules.finance.entity.TopUp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public interface TopUpRepository extends JpaRepository<TopUp, Long>, JpaSpecificationExecutor<TopUp> {
    List<TopUp> findByClientIdAndStatus(Long clientId, TopUp.Status status);
    
    // ✅ НОВЫЕ МЕТОДЫ: Агрегирующие запросы
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM TopUp t " +
           "WHERE t.status = 'APPROVED' AND t.createdAt >= :date")
    BigDecimal sumApprovedTopUpsAfterDate(@Param("date") Instant date);
    
    long countByStatus(TopUp.Status status);
}
