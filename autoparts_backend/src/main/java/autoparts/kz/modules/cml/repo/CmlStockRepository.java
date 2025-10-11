package autoparts.kz.modules.cml.repo;

import autoparts.kz.modules.cml.domain.entity.CmlStock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CmlStockRepository extends JpaRepository<CmlStock, Long> {
    Optional<CmlStock> findByProductGuidAndWarehouseGuid(String productGuid, String warehouseGuid);
}
