package autoparts.kz.modules.cml.repo;

import autoparts.kz.modules.cml.domain.entity.CmlCustomer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CmlCustomerRepository extends JpaRepository<CmlCustomer, Long> {
    Optional<CmlCustomer> findByGuid(String guid);
}
