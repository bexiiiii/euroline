package autoparts.kz.modules.finance.repository;

import autoparts.kz.modules.finance.entity.TopUp;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface TopUpRepository extends JpaRepository<TopUp, Long>, JpaSpecificationExecutor<TopUp> {
    List<TopUp> findByClientIdAndStatus(Long clientId, TopUp.Status status);
    
    // ✅ НОВЫЕ МЕТОДЫ: Агрегирующие запросы
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM TopUp t " +
           "WHERE t.status = 'APPROVED' AND t.createdAt >= :date")
    BigDecimal sumApprovedTopUpsAfterDate(@Param("date") Instant date);
    
    long countByStatus(TopUp.Status status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM TopUp t WHERE t.id = :id")
    Optional<TopUp> findByIdForUpdate(@Param("id") Long id);

    // Kaspi: pending top-ups the poller must verify, least recently checked first
    @Query("SELECT t FROM TopUp t WHERE t.status = 'PENDING' AND t.kaspiType IS NOT NULL AND t.kaspiOperationId IS NOT NULL " +
           "ORDER BY t.kaspiCheckedAt ASC NULLS FIRST, t.id ASC")
    List<TopUp> findPendingKaspi(Pageable pageable);

    // Kaspi top-ups whose Kaspi operation was never created (sidecar error/timeout after our row was saved)
    @Query("SELECT t FROM TopUp t WHERE t.status = 'PENDING' AND t.kaspiType IS NOT NULL AND t.kaspiOperationId IS NULL " +
           "AND t.createdAt < :before")
    List<TopUp> findKaspiWithoutOperation(@Param("before") Instant before);

    /** Updates only Kaspi bookkeeping columns, never status — so it cannot overwrite a concurrent approval. */
    @Modifying
    @Transactional
    @Query("UPDATE TopUp t SET t.kaspiStatus = :kaspiStatus, t.kaspiCheckedAt = :checkedAt WHERE t.id = :id")
    int updateKaspiState(@Param("id") Long id, @Param("kaspiStatus") String kaspiStatus, @Param("checkedAt") Instant checkedAt);

    long countByClientIdAndStatusAndKaspiTypeIsNotNull(Long clientId, TopUp.Status status);
}
