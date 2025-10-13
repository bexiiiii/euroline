package autoparts.kz.modules.cart.repository;


import autoparts.kz.modules.cart.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    @Transactional
    @Modifying(clearAutomatically = true)
    @Query("delete from CartItem ci where ci.cart.id = :cartId")
    void deleteByCartId(@Param("cartId") Long cartId);
}
