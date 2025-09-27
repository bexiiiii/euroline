package autoparts.kz.modules.finance.repository;

import autoparts.kz.modules.finance.entity.TopUp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface TopUpRepository extends JpaRepository<TopUp, Long>, JpaSpecificationExecutor<TopUp> {
    List<TopUp> findByClientIdAndStatus(Long clientId, TopUp.Status status);
}
