package autoparts.kz.modules.cml.repo;

import autoparts.kz.modules.cml.domain.entity.CmlStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CmlStockRepository extends JpaRepository<CmlStock, Long> {
    Optional<CmlStock> findByProductGuidAndWarehouseGuid(String productGuid, String warehouseGuid);
    
    // 🔍 НОВЫЙ МЕТОД: Получить все остатки товара по складам для детализации
    @Query("SELECT s FROM CmlStock s WHERE s.productGuid = :productGuid ORDER BY s.quantity DESC")
    List<CmlStock> findAllByProductGuid(@Param("productGuid") String productGuid);
    
    // 🚀 BATCH OPTIMIZATION: Получить остатки нескольких товаров одним запросом
    @Query("SELECT s FROM CmlStock s WHERE s.productGuid IN :productGuids ORDER BY s.productGuid, s.quantity DESC")
    List<CmlStock> findAllByProductGuidIn(@Param("productGuids") List<String> productGuids);
}
