package autoparts.kz.modules.order.repository;


import autoparts.kz.modules.order.entity.Order;
import autoparts.kz.modules.order.orderStatus.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {

    @Query("""
           select coalesce(sum(oi.price * oi.quantity), 0)
           from OrderItem oi
           """)
    BigDecimal totalRevenue();
    
    @EntityGraph(attributePaths = {"items", "items.product"})
    @Query("SELECT o FROM Order o WHERE o.createdAt >= :startDate AND o.createdAt < :endDate")
    List<Order> findByCreatedAtBetween(@Param("startDate") LocalDateTime startDate, 
                                      @Param("endDate") LocalDateTime endDate);

    @EntityGraph(attributePaths = {"items", "items.product"})
    @Query("SELECT o FROM Order o")
    List<Order> findAllWithItems();

    Optional<Order> findByExternalId(String externalId);
    Optional<Order> findByIdempotencyKey(String idempotencyKey);
    Optional<Order> findByPublicCode(String publicCode);
    boolean existsByPublicCode(String publicCode);

    @EntityGraph(attributePaths = {"user", "items", "items.product"})
    Page<Order> findByUser_Id(Long userId, Pageable pageable);

    @Query("""
            select o.id
            from Order o
            where o.status in :statuses
            order by o.createdAt asc
            """)
    Page<Long> findIdsByStatusIn(@Param("statuses") Collection<OrderStatus> statuses, Pageable pageable);

    @Query("""
           select count(o)
           from Order o
           where o.createdAt >= :start and o.createdAt < :end
           """)
    long countCreatedBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    long countByStatus(OrderStatus status);

    @Query("""
           select count(o)
           from Order o
           where o.status = :status
             and o.createdAt >= :start and o.createdAt < :end
           """)
    long countByStatusAndCreatedBetween(@Param("status") OrderStatus status,
                                        @Param("start") LocalDateTime start,
                                        @Param("end") LocalDateTime end);

    @Query("""
           select coalesce(sum(oi.price * oi.quantity), 0)
           from Order o
           join o.items oi
           where o.createdAt >= :start and o.createdAt < :end
           """)
    BigDecimal sumTotalBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
