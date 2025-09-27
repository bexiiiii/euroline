package autoparts.kz.modules.returns.repository;


import autoparts.kz.modules.returns.entity.ReturnRequest;
import autoparts.kz.modules.returns.status.ReturnStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, Long>, JpaSpecificationExecutor<ReturnRequest> {
    boolean existsByOrderIdAndCustomerIdAndStatusNot(Long orderId, Long customerId, ReturnStatus status);
}
