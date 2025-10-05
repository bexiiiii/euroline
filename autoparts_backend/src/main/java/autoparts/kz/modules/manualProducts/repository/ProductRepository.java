package autoparts.kz.modules.manualProducts.repository;

import autoparts.kz.modules.manualProducts.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    // Поиск по названию (частичное совпадение), коду или VIN (в нашем случае VIN = externalCode)
    @Query("SELECT p FROM Product p WHERE " +
            "LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(p.code) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(p.externalCode) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Product> searchByQuery(@Param("query") String query);

    // Подборка товаров недели
    org.springframework.data.domain.Page<Product> findByIsWeeklyTrue(org.springframework.data.domain.Pageable pageable);

    // Поиск продуктов по ID с загрузкой связанных свойств
    @Query("SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.properties WHERE p.id IN :ids")
    List<Product> findAllByIdWithProperties(@Param("ids") List<Long> ids);

    java.util.Optional<Product> findFirstByCodeIgnoreCase(String code);
}
