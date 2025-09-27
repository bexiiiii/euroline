package autoparts.kz.modules.order.repository;

import autoparts.kz.modules.order.entity.OrderItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    interface TopProductProjection {
        Long getProductId();
        Long getTotalQty();
    }

    @Query(value = """
            select p.id as productId, sum(oi.quantity) as totalQty
            from order_items oi
            join orders o on o.id = oi.order_id
            join products p on p.id = oi.product_id
            where o.created_at >= :start
              and o.created_at < :end
              and o.status in (:statuses)
              and (:brandsEmpty = true or p.brand in (:brands))
              and (:inStock is null or ((:inStock = true and p.stock > 0) or (:inStock = false and p.stock = 0)))
              and (:priceFrom is null or p.price >= :priceFrom)
              and (:priceTo is null or p.price <= :priceTo)
            group by p.id
            order by sum(oi.quantity) desc, p.id desc
            """,
            nativeQuery = true)
    List<TopProductProjection> findTopProductsForPeriod(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("statuses") Collection<String> statuses,
            @Param("brands") Collection<String> brands,
            @Param("brandsEmpty") boolean brandsEmpty,
            @Param("inStock") Boolean inStock,
            @Param("priceFrom") Integer priceFrom,
            @Param("priceTo") Integer priceTo,
            Pageable pageable
    );

    @Query(value = """
            select count(distinct p.id)
            from order_items oi
            join orders o on o.id = oi.order_id
            join products p on p.id = oi.product_id
            where o.created_at >= :start
              and o.created_at < :end
              and o.status in (:statuses)
              and (:brandsEmpty = true or p.brand in (:brands))
              and (:inStock is null or ((:inStock = true and p.stock > 0) or (:inStock = false and p.stock = 0)))
              and (:priceFrom is null or p.price >= :priceFrom)
              and (:priceTo is null or p.price <= :priceTo)
            """,
            nativeQuery = true)
    long countTopProductsForPeriod(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("statuses") Collection<String> statuses,
            @Param("brands") Collection<String> brands,
            @Param("brandsEmpty") boolean brandsEmpty,
            @Param("inStock") Boolean inStock,
            @Param("priceFrom") Integer priceFrom,
            @Param("priceTo") Integer priceTo
    );
}
