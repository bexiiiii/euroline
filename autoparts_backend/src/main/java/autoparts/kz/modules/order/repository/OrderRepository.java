package autoparts.kz.modules.order.repository;


import autoparts.kz.modules.order.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {

    @Query("""
           select coalesce(sum(oi.price * oi.quantity), 0)
           from OrderItem oi
           """)
    BigDecimal totalRevenue();
    
    @Query("SELECT o FROM Order o WHERE o.createdAt >= :startDate AND o.createdAt < :endDate")
    List<Order> findByCreatedAtBetween(@Param("startDate") LocalDateTime startDate, 
                                      @Param("endDate") LocalDateTime endDate);

    Optional<Order> findByExternalId(String externalId);
    Optional<Order> findByIdempotencyKey(String idempotencyKey);
    Optional<Order> findByPublicCode(String publicCode);

    @EntityGraph(attributePaths = {"user", "items", "items.product"})
    Page<Order> findByUser_Id(Long userId, Pageable pageable);
}
