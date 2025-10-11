package autoparts.kz.modules.cml.repo;
import autoparts.kz.modules.cml.domain.entity.CmlOrder;
import autoparts.kz.modules.cml.domain.entity.CmlOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CmlOrderRepository extends JpaRepository<CmlOrder, Long> {

    Optional<CmlOrder> findByGuid(String guid);

    Optional<CmlOrder> findByNumber(String number);

    @Query("select o from CmlOrder o where o.createdAt >= :createdAfter")
    List<CmlOrder> findAllCreatedAfter(LocalDateTime createdAfter);

    List<CmlOrder> findByStatusIn(List<CmlOrderStatus> statuses);
}
