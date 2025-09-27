package autoparts.kz.modules.cart.repository;

import autoparts.kz.modules.cart.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {
    Optional<Cart> findByUserId(Long userId);

    @Query("select distinct c from Cart c left join fetch c.items i left join fetch i.product p where c.user.id = :uid")
    Optional<Cart> findByUserIdFetch(@Param("uid") Long userId);

    @EntityGraph(attributePaths = {"items", "items.product", "user"})
    @Query("select c from Cart c")
    List<Cart> findAllWithItems();

    @EntityGraph(attributePaths = {"items", "items.product", "user"})
    @Query(value = "select c from Cart c", countQuery = "select count(c) from Cart c")
    Page<Cart> findAllWithItems(Pageable pageable);

    @EntityGraph(attributePaths = {"items", "items.product", "user"})
    @Query("select c from Cart c where c.id = :id")
    Optional<Cart> findByIdWithItems(@Param("id") Long id);

}
