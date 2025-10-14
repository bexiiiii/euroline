package autoparts.kz.modules.finance.repository;

import autoparts.kz.modules.finance.entity.RefundRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;

public interface RefundRequestRepository extends JpaRepository<RefundRequest, Long>, JpaSpecificationExecutor<RefundRequest> {
    
    // ✅ НОВЫЕ МЕТОДЫ: Агрегирующие запросы
    @Query("SELECT COALESCE(SUM(r.amount), 0) FROM RefundRequest r " +
           "WHERE r.status IN :statuses AND r.createdAt >= :date")
    BigDecimal sumRefundsByStatusesAfterDate(
        @Param("statuses") Collection<RefundRequest.Status> statuses,
        @Param("date") Instant date
    );
    
    long countByStatusIn(Collection<RefundRequest.Status> statuses);
}
