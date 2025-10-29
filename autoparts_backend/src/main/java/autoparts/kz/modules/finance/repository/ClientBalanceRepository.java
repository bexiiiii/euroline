package autoparts.kz.modules.finance.repository;

import autoparts.kz.modules.finance.entity.ClientBalance;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;

public interface ClientBalanceRepository extends JpaRepository<ClientBalance, Long> {
    Page<ClientBalance> findAll(Pageable pageable);

    // ✅ НОВЫЙ МЕТОД: Сумма всех балансов
    @Query("SELECT COALESCE(SUM(b.balance), 0) FROM ClientBalance b")
    BigDecimal sumAllBalances();

    @Query("SELECT COALESCE(SUM(b.creditLimit), 0) FROM ClientBalance b")
    BigDecimal sumAllCreditLimits();

    @Query("SELECT COALESCE(SUM(b.creditUsed), 0) FROM ClientBalance b")
    BigDecimal sumAllCreditUsed();
}
