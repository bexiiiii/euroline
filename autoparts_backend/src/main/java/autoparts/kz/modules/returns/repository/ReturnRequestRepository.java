package autoparts.kz.modules.returns.repository;


import autoparts.kz.modules.returns.entity.ReturnRequest;
import autoparts.kz.modules.returns.status.ReturnStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;

public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, Long>, JpaSpecificationExecutor<ReturnRequest> {
    boolean existsByOrderIdAndCustomerIdAndStatusNot(Long orderId, Long customerId, ReturnStatus status);

    @Query("""
            select count(r)
            from ReturnRequest r
            where r.createdAt >= :start and r.createdAt < :end
            """)
    long countCreatedBetween(@Param("start") Instant start, @Param("end") Instant end);

    @Query("""
            select coalesce(sum(r.amount), 0)
            from ReturnRequest r
            where r.createdAt >= :start and r.createdAt < :end
            """)
    BigDecimal sumAmountBetween(@Param("start") Instant start, @Param("end") Instant end);

    long countByStatus(ReturnStatus status);

    @Query("""
            select count(r)
            from ReturnRequest r
            where r.status = :status
              and r.createdAt >= :start and r.createdAt < :end
            """)
    long countByStatusAndCreatedBetween(@Param("status") ReturnStatus status,
                                        @Param("start") Instant start,
                                        @Param("end") Instant end);
}
