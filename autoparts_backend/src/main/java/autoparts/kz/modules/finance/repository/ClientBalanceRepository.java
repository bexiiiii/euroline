package autoparts.kz.modules.finance.repository;

import autoparts.kz.modules.finance.entity.ClientBalance;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClientBalanceRepository extends JpaRepository<ClientBalance, Long> {
    Page<ClientBalance> findAll(Pageable pageable);
}