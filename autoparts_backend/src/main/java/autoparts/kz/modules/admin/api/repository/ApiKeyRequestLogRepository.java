package autoparts.kz.modules.admin.api.repository;

import autoparts.kz.modules.admin.api.entity.ApiKey;
import autoparts.kz.modules.admin.api.entity.ApiKeyRequestLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface ApiKeyRequestLogRepository extends JpaRepository<ApiKeyRequestLog, Long> {

    long countByRequestedAtAfter(Instant since);

    @Query("select count(l) from ApiKeyRequestLog l where l.responseStatus >= 500 and l.requestedAt >= :since")
    long countErrorsSince(@Param("since") Instant since);

    List<ApiKeyRequestLog> findTop20ByApiKeyOrderByRequestedAtDesc(ApiKey apiKey);
}
