package autoparts.kz.modules.customers.repository;

import autoparts.kz.modules.customers.entity.CustomerSearchQuery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface CustomerSearchHistoryRepository extends JpaRepository<CustomerSearchQuery, Long>, JpaSpecificationExecutor<CustomerSearchQuery> {}