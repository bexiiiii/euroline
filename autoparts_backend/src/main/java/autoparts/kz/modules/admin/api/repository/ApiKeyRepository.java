package autoparts.kz.modules.admin.api.repository;

import autoparts.kz.modules.admin.api.entity.ApiKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface ApiKeyRepository extends JpaRepository<ApiKey, Long> {

    List<ApiKey> findByActiveTrue();

    long countByActiveTrue();

    @Query("select count(k) from ApiKey k where k.active = false and k.revokedAt is not null")
    long countRevoked();

    @Query("select coalesce(sum(k.requestCount), 0) from ApiKey k")
    long sumRequestCount();

    @Query("select coalesce(sum(case when k.lastUsedAt >= :since then 1 else 0 end), 0) from ApiKey k")
    long countRecentlyUsed(@Param("since") Instant since);
}
