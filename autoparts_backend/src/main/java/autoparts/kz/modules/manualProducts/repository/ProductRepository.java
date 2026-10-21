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

    // Поиск по названию, артикулу и стабильному ключу новой интеграции 1С.
    @Query("SELECT p FROM Product p WHERE " +
            "LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(p.code) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(p.externalCode) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(p.oneCRefKey) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Product> searchByQuery(@Param("query") String query);

    // Подборка товаров недели
    org.springframework.data.domain.Page<Product> findByIsWeeklyTrue(org.springframework.data.domain.Pageable pageable);

    // Поиск продуктов по ID с загрузкой связанных свойств
    @Query("SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.properties WHERE p.id IN :ids")
    List<Product> findAllByIdWithProperties(@Param("ids") List<Long> ids);

    java.util.Optional<Product> findFirstByCodeIgnoreCase(String code);

    java.util.Optional<Product> findByOneCRefKey(String oneCRefKey);

    // ✅ НОВЫЙ МЕТОД: Подсчет товаров по категориям (агрегирующий запрос)
    @Query("SELECT c.name, COUNT(p) FROM Product p " +
           "JOIN p.category c " +
           "GROUP BY c.name " +
           "ORDER BY COUNT(p) DESC")
    List<Object[]> countProductsByCategory();

    // 🚀 Быстрые методы для статистики
    long countByStockGreaterThan(Integer stock);
    long countByExternalCodeIsNotNull();

    // 🔍 НОВЫЕ МЕТОДЫ: Поиск по артикулу для обогащения результатов поиска данными из 1С
    @Query("SELECT p FROM Product p WHERE LOWER(p.code) = LOWER(:article) OR LOWER(p.sku) = LOWER(:article)")
    java.util.Optional<Product> findByArticle(@Param("article") String article);

    @Query("SELECT p FROM Product p WHERE p.externalCode = :externalCode")
    java.util.Optional<Product> findByExternalCode(@Param("externalCode") String externalCode);
    
    // 🚀 BATCH OPTIMIZATION: Найти несколько товаров по артикулам одним запросом
    @Query("SELECT p FROM Product p WHERE LOWER(p.code) IN :articles OR LOWER(p.sku) IN :articles")
    List<Product> findAllByArticleIn(@Param("articles") List<String> articles);

    // Совпадение артикула без учёта регистра, пробелов, дефисов и точек (OEM из каталога vs код в 1С)
    @Query(value = "SELECT * FROM products p WHERE " +
            "regexp_replace(lower(coalesce(p.code, '')), '[^a-z0-9]', '', 'g') IN (:keys) " +
            "OR regexp_replace(lower(coalesce(p.sku, '')), '[^a-z0-9]', '', 'g') IN (:keys) " +
            "OR ((p.sku IS NULL OR trim(p.sku) = '') AND lower(p.brand) = '1c' " +
            "AND regexp_replace(lower(split_part(trim(p.name), ' ', 2)), '[^a-z0-9]', '', 'g') IN (:keys))",
            nativeQuery = true)
    List<Product> findAllByNormalizedArticleIn(@Param("keys") List<String> keys);
}
