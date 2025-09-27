package autoparts.kz.modules.finance.repository;

import autoparts.kz.modules.finance.entity.FinanceTxn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface FinanceTxnRepository extends JpaRepository<FinanceTxn, Long>, JpaSpecificationExecutor<FinanceTxn> {
    boolean existsByClientIdAndTypeAndDescription(Long clientId, String type, String description);

    @Query("select coalesce(sum(t.amount),0) from FinanceTxn t where t.clientId = :clientId")
    java.math.BigDecimal sumAmountByClientId(Long clientId);
}
