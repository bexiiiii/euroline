package autoparts.kz.modules.category.repository;

import autoparts.kz.modules.category.entity.Category;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    @EntityGraph(attributePaths = {"parent"})
    Optional<Category> findBySlug(String slug);

    @EntityGraph(attributePaths = {"parent"})
    List<Category> findByParentIsNullOrderBySortOrderAscNameAsc();

    @EntityGraph(attributePaths = {"parent"})
    List<Category> findByParentIdOrderBySortOrderAscNameAsc(Long parentId);

    @EntityGraph(attributePaths = {"parent"})
    List<Category> findAllByOrderBySortOrderAscNameAsc();

    @Query("select c from Category c where c.id in :ids")
    List<Category> findAllByIdIn(@Param("ids") Collection<Long> ids);

    @Query("select c.id as categoryId, count(p.id) as productCount " +
           "from Category c left join c.products p " +
           "where c.id in :ids group by c.id")
    List<ProductCountProjection> countProducts(@Param("ids") Collection<Long> ids);

    interface ProductCountProjection {
        Long getCategoryId();
        Long getProductCount();
    }
}
