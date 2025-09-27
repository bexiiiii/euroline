package autoparts.kz.modules.finance.repository;

import autoparts.kz.modules.finance.entity.RefundRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface RefundRequestRepository extends JpaRepository<RefundRequest, Long>, JpaSpecificationExecutor<RefundRequest> {}