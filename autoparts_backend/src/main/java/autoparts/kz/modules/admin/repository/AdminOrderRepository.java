package autoparts.kz.modules.admin.repository;

import autoparts.kz.modules.admin.entity.Advertisement;
import autoparts.kz.modules.order.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface AdminOrderRepository extends JpaRepository<Advertisement, Long> {
    List<Order> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

}
